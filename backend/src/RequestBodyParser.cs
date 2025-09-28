namespace WebApp;
public static class RequestBodyParser
{
    public static dynamic ReqBodyParse(string table, Obj body)
    {
        // For users table: map password to PasswordHash BEFORE creating keys
        if (table == "users" && body.HasKey("password"))
        {
            body["PasswordHash"] = body["password"];
            body.Delete("password");
        }
        
        // Always remove "role" for users table
        var keys = body.GetKeys().Filter(key => table != "users" || key != "role");
        // Clean up the body by converting strings to numbers when possible
        var cleaned = Obj();
        keys.ForEach(key
            => cleaned[key] = ((object)(body[key])).TryToNumber());
        // Always encrypt fields named "password" OR "PasswordHash"
        if (cleaned.HasKey("password"))
        {
            cleaned["password"] = Password.Encrypt(cleaned["password"] + "");
        }
        if (cleaned.HasKey("PasswordHash"))
        {
            cleaned["PasswordHash"] = Password.Encrypt(cleaned["PasswordHash"] + "");
        }
        // Return parts to use when building the SQL query + the cleaned body
        return Obj(new
        {
            insertColumns = keys.Join(","),
            insertValues = "$" + keys.Join(",$"),
            update = keys.Filter(key => key != "id").Map(key => $"{key}=${key}").Join(","),
            body = cleaned
        });
    }
}