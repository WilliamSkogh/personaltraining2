namespace WebApp;
public static class LoginRoutes
{
    private static Obj GetUser(HttpContext context)
    {
        return Session.Get(context, "user");
    }

    public static void Start()
    {
        // POST /api/register - Registrera ny användare
        App.MapPost("/api/register", (HttpContext context, JsonElement bodyJson) =>
        {
            var body = JSON.Parse(bodyJson.ToString());

            // Kolla om användaren redan finns (case-insensitive)
            var existingUser = SQLQueryOne(
                "SELECT * FROM users WHERE LOWER(Email) = LOWER($email)",
                new { email = body.Email },
                context
            );

            if (existingUser != null && !existingUser.HasKey("error"))
            {
                return RestResult.Parse(context, new { error = "User already exists." });
            }

            // Kolla om det är första användaren (blir automatiskt admin)
            var userCount = SQLQueryOne("SELECT COUNT(*) as count FROM users", null, context);
            var isFirstUser = userCount.count == 0;

            // Skapa användaren med ReqBodyParse för att hantera lösenordskryptering
            var parsed = ReqBodyParse("users", Obj(new
            {
                Email = body.Email,
                Username = body.Username,
                password = body.password,
                Role = isFirstUser ? "admin" : "user"
            }));

            var sql = @"
                INSERT INTO users (Email, Username, PasswordHash, Role)
                VALUES ($Email, $Username, $PasswordHash, $Role)
            ";

            var result = SQLQueryOne(sql, parsed.body, context);

            if (result.HasKey("error"))
            {
                return RestResult.Parse(context, result);
            }

            // Hämta den nyskapade användaren (case-insensitive)
            var newUser = SQLQueryOne(
                "SELECT * FROM users WHERE LOWER(Email) = LOWER($email)",
                new { email = body.Email },
                context
            );

            // Logga in användaren direkt
            newUser.Delete("PasswordHash");
            Session.Set(context, "user", newUser);

            return RestResult.Parse(context, newUser);
        });

        App.MapPost("/api/login", (HttpContext context, JsonElement bodyJson) =>
        {
            var user = GetUser(context);
            var body = JSON.Parse(bodyJson.ToString());

            // If there is a user logged in already
            if (user != null)
            {
                Session.Set(context, "user", null);
            }

            // Find the user in the DB (case-insensitive)
            var dbUser = SQLQueryOne(
                "SELECT * FROM users WHERE LOWER(Email) = LOWER($email)",
                new { body.email },
                context
            );
            
            if (dbUser == null || dbUser.HasKey("error"))
            {
                return RestResult.Parse(context, new { error = "No such user." });
            }

            // If the password doesn't match
            if (!Password.Verify(
                (string)body.password,
                (string)dbUser.PasswordHash 
            ))
            {
                return RestResult.Parse(context,
                    new { error = "Password mismatch." });
            }

            // Add the user to the session, without password
            dbUser.Delete("PasswordHash");
            Session.Set(context, "user", dbUser);

            // Return the user
            return RestResult.Parse(context, dbUser!);
        });

        App.MapGet("/api/login", (HttpContext context) =>
        {
            var user = GetUser(context);
            return RestResult.Parse(context, user != null ?
                user : new { error = "No user is logged in." });
        });

        App.MapDelete("/api/login", (HttpContext context) =>
        {
            var user = GetUser(context);

            // Delete the user from the session
            Session.Set(context, "user", null);

            return RestResult.Parse(context, user == null ?
                new { error = "No user is logged in." } :
                new { status = "Successful logout." }
            );
        });
    }
}