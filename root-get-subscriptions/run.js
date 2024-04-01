import { handler } from "./index.mjs";
const main = async () => {
  const res = await handler({});
  console.log("res~~~", res);
};

main();
