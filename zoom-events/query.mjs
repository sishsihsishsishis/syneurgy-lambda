export async function users(db, options = {}) {
  const { command, data, filters } = options;

  switch (command) {
    case "get-users-by-id":
      return db.query("SELECT * FROM users WHERE id = $1", [filters.id]);
    case "get-users-by-email":
      return db.query("SELECT * FROM users WHERE email = $1", [filters.email]);
    case "get-users-by-zoom-email":
      return db.query("SELECT * FROM users WHERE zoom_email = $1", [
        filters.email,
      ]);
  }
  return undefined;
}

export async function teams(db, options = {}) {
    const { command, filters } = options;
  
    switch (command) {
      case "get-teamIds-by-id":
        return db.query(
          "SELECT team_id FROM user_team WHERE user_id = $1 AND is_active = true",
          [filters.user_id]
        );
    }
  
    return undefined;
  }
