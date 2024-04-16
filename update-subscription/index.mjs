// index.mjs

import stripe from "stripe";

import * as configEnv from './config.mjs';
import * as queryFunction from './query.mjs';
import * as utils from './utils.mjs';

const stripeInstance = stripe(configEnv.stripeSecretKey);

async function compareProductPrices(current_price_id, price_id) {
    try {
        // Get the current and new prices
        const currentPrice = await stripeInstance.prices.retrieve(current_price_id);
        const newPrice = await stripeInstance.prices.retrieve(price_id);

        // Compare the prices
        if (currentPrice.unit_amount < newPrice.unit_amount) {
            return 'more_expensive';
        } else if (currentPrice.unit_amount > newPrice.unit_amount) {
            return 'less_expensive';
        } else {
            return 'same_price';
        }
    } catch (error) {
        console.error('Error comparing prices', error);
    }
}

async function getSubscriptionScheduleId(currentSubscription, customerId) {

    const schedules = await stripeInstance.subscriptionSchedules.list({
        customer: customerId
    });

    if (schedules.data.length > 0) {
        // We need to check if there is an active or not_started schedule

        for (let i = 0; i < schedules.data.length; i++) {
            const schedule = schedules.data[i];
            if (schedule.status === 'not_started' || schedule.status === 'active') {
                return schedule;
            }
        }
        const schedule = await stripeInstance.subscriptionSchedules.create({
            from_subscription: currentSubscription.id
        });
        return schedule;
    } else {
        const schedule = await stripeInstance.subscriptionSchedules.create({
            from_subscription: currentSubscription.id
        });
        return schedule;
    }

}

export const handler = async (event) => {
    const client = utils.parseAndCheckHttpError(await utils.getDBInstance());

    try {

        // CORS Preflight
        if (event?.requestContext?.http?.method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: configEnv.headers,
                body: '',
            };
        }

        // Get token email (current user)
        const email = utils.parseAndCheckHttpError(await utils.getTokenEmail(event));

        // Check if you are the administrator or provider of this license
        const subscription = await queryFunction.subscriptions(
            client,
            {
                command: 'get-subscription-by-user_email',
                filters: { user_email: email }
            }
        );
        const subscriptionData = subscription?.rows[0];

        if (!subscriptionData) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ email, error: 'You do not have permission for this resource.' }),
            };
        }

        if (!event.body) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ error: 'Missing request body.' }),
            };
        }

        const requestBody = JSON.parse(event.body);
        const { price_id, new_quantity, license_ids } = requestBody;

        if (!price_id) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ error: 'Missing price_id parameter.' }),
            };
        }

        if (!new_quantity) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ error: 'Missing new_quantity parameter.' }),
            };
        }

        const subscriptionId = subscriptionData?.stripe_data?.subscription?.id;

        // Get the current subscription to find the subscription item ID
        const currentSubscription = await stripeInstance.subscriptions.retrieve(subscriptionId);

        // Get the subscription item (we suppose that the subscription has only one line item (product))
        const subscriptionItem = currentSubscription.items.data[0];
        const subscriptionItemId = currentSubscription.items.data[0].id;
        const currentProductQuantity = currentSubscription.items.data[0].quantity;


        /*if (new_quantity < currentProductQuantity) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ error: 'New quantity must be greater or equal than the current one' }),
            };
        }*/


        // Get the customer ID
        const customerId = currentSubscription.customer;

        // Get the current price ID
        const current_price_id = subscriptionItem.price.id;

        let upgradeOrSame = true;

        switch (await compareProductPrices(current_price_id, price_id)) {
            case 'less_expensive':
                upgradeOrSame = false;
                break;
            default:
                if (new_quantity < currentProductQuantity) {
                    upgradeOrSame = false;
                }
                break;
        }

        if (new_quantity < currentProductQuantity) {
            
            // If the new quantity is less than the current one, we need to check if the user has licenses to remove
            if (!license_ids) {
                return {
                    statusCode: 400,
                    headers: configEnv.headers,
                    body: JSON.stringify({ error: 'Missing license_ids parameter.' }),
                };
            }

            if (license_ids !== null && license_ids.length > 0 && license_ids.length > (new_quantity)) {
                return {
                    statusCode: 400,
                    headers: configEnv.headers,
                    body: JSON.stringify({ error: 'The amount of scheduled licenses needs to be less or equal to the new plan quantity' }),
                };
            }
        }
        

        console.log('upgradeOrSame', upgradeOrSame)
        let updatedSubscription = null;

        if (upgradeOrSame) {
            // Update the subscription item with the new price and quantity (UPGRADE or SAME PRICE)
            updatedSubscription = await stripeInstance.subscriptions.update(subscriptionId, {
                items: [{
                    id: subscriptionItemId,
                    price: price_id, // New price ID
                    quantity: new_quantity, // New quantity
                }],
            });
            console.log('Subscription updated:', updatedSubscription);
        }
        else {

            // Update the subscription item with the new price and quantity (DOWNGRADE)
            const schedule = await getSubscriptionScheduleId(currentSubscription, customerId);

            const scheduleId = schedule.id;
            console.log('Subscription Schedule ID:', scheduleId);

            let now = Math.floor(Date.now() / 1000); 
            
            // only for test mode
            const testClockId = currentSubscription.test_clock;
            if (testClockId != null) {
                const testClock = await stripeInstance.testHelpers.testClocks.retrieve(testClockId);
                now = testClock.frozen_time;
            }
            
            const inTrial = currentSubscription.trial_end && currentSubscription.trial_end > now;
            const currPhase = schedule.phases[schedule.phases.length - 1];


            const phasesToUpdate = [];
            if (!inTrial) {
                phasesToUpdate.push({
                    items: [{ price: currPhase.items[0].price, quantity: currPhase.items[0].quantity }],
                    start_date: currPhase.start_date,
                    end_date: currPhase.end_date,
                    proration_behavior: 'none'
                });
                phasesToUpdate.push({
                    items: [{ price: price_id, quantity: new_quantity }]
                });
            }
            else{
                const currPhase = schedule.phases[0];
                phasesToUpdate.push({
                    items: [{ price: currPhase.items[0].price, quantity: currPhase.items[0].quantity }],
                    start_date: currPhase.start_date,
                    end_date: currPhase.end_date,
                    trial: true,
                    proration_behavior: 'none'
                });
                phasesToUpdate.push({
                    items: [{ price: price_id, quantity: new_quantity }],
                    start_date: currentSubscription.trial_end
                });
            }
            

            const updatedSchedule = await stripeInstance.subscriptionSchedules.update(scheduleId, {
                phases: phasesToUpdate
            });
            console.log('Subscription Schedule updated:', updatedSchedule);

            const scheduled_date = updatedSchedule.phases[updatedSchedule.phases.length - 1].start_date;
            console.log('Next change on:', scheduled_date);


            // Check if you are the administrator or provider of this license
            const subscription = await queryFunction.subscriptions(
            client, 
            { command: 'get-subscription-by-user_email',
                filters: { user_email: email }
            }
            );
            const subscriptionData = subscription?.rows[0];

            if (!subscriptionData) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ email, error: 'You do not have permission for this resource.' }),
            };
            }

            if (!subscriptionData) {
            return {
                statusCode: 400,
                headers: configEnv.headers,
                body: JSON.stringify({ error: 'Subscription not found.' }),
            };
            }

            if (new_quantity < currentProductQuantity) {
                // We need to store the licenses to be preserved
                for (let i = 0; i < license_ids.length; i++) {
                    const license_schedule = await queryFunction.createLicenseSchedule(client, subscriptionData.id, license_ids[i], scheduled_date);
                }
            }
        }

        const response = {
            statusCode: 200,
            headers: configEnv.headers,
            body: JSON.stringify({
                subscription: currentSubscription,
                updatedSubscription: updatedSubscription
            }),
        };

        return response;
    }
    catch (error) {
        console.log(error);
        return {
            statusCode: error?.details?.statusCode || 500,
            headers: configEnv.headers,
            body: JSON.stringify(error?.details?.body || { error: 'Internal Server Error.' }),
        };
    }
    finally {
        await client.end();
    }
};
