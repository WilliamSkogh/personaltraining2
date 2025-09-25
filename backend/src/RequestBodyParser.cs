namespace WebApp;

public static class RequestBodyParser
{
    public static dynamic ReqBodyParse(string table, Obj body)
    {
        var cleaned = Obj();
        foreach (var key in body.GetKeys())
        {
            cleaned[key] = ((object)body[key]).TryToNumber();
        }

        var isUsers = string.Equals(table, "users", StringComparison.OrdinalIgnoreCase);
        if (isUsers)
        {
            if (cleaned.HasKey("email"))
            {
                cleaned.Email = cleaned.email;
                cleaned.Delete("email");
            }
            if (cleaned.HasKey("username"))
            {
                cleaned.Username = cleaned.username;
                cleaned.Delete("username");
            }
            if (cleaned.HasKey("password"))
            {
                cleaned.PasswordHash = Password.Encrypt(cleaned.password + "");
                cleaned.Delete("password");
            }
        }

        Arr keysArr = (Arr)cleaned.GetKeys();
        var insertColumns = keysArr.Join(",");
        var insertValues = "$" + keysArr.Join(",$");

        var noId = keysArr.Filter(x => x != "Id" && x != "id");
        var update = ((Arr)noId.Map(x => $"{x}=${x}")).Join(",");

        return Obj(new
        {
            insertColumns,
            insertValues,
            update,
            body = cleaned
        });
    }
}
