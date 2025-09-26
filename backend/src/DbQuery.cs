using Microsoft.Data.Sqlite;
using System.IO;

namespace WebApp;

public static class DbQuery
{
    private static string _dbPath;
    private static string _connStr;
    private static SqliteConnection _db;

    static DbQuery()
    {

        _dbPath = (string)(Globals.dbPath ?? "");
        if (string.IsNullOrWhiteSpace(_dbPath))
        {

            _dbPath = Path.Combine(AppContext.BaseDirectory, "data", "_db.sqlite3");
        }


        var dir = Path.GetDirectoryName(_dbPath);
        if (string.IsNullOrWhiteSpace(dir))
            throw new Exception($"Ogiltig dbPath: '{_dbPath}' (saknar mappdel)");
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);


        if (!File.Exists(_dbPath))
        {

            var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));
            var templ1 = Path.Combine(repoRoot, "db_template", "_db.sqlite3");
            var templ2 = Path.Combine(repoRoot, "backend", "db_template", "_db.sqlite3");

            if (File.Exists(templ1))
            {
                File.Copy(templ1, _dbPath);
            }
            else if (File.Exists(templ2))
            {
                File.Copy(templ2, _dbPath);
            }
            else
            {

                using var tmp = new SqliteConnection(new SqliteConnectionStringBuilder
                {
                    DataSource = _dbPath,
                    Cache = SqliteCacheMode.Shared,
                    Mode = SqliteOpenMode.ReadWriteCreate
                }.ToString());
                tmp.Open();
            }
        }


        _connStr = new SqliteConnectionStringBuilder
        {
            DataSource = _dbPath,
            Cache = SqliteCacheMode.Shared,
            Mode = SqliteOpenMode.ReadWriteCreate
        }.ToString();

        _db = new SqliteConnection(_connStr);
        _db.Open();


        try
        {
            using var cmd = _db.CreateCommand();
            cmd.CommandText = @"
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=1000;";
            cmd.ExecuteNonQuery();
        }
        catch { }
    }


    private static dynamic ObjFromReader(SqliteDataReader reader)
    {
        var obj = Obj();
        for (var i = 0; i < reader.FieldCount; i++)
        {
            var key = reader.GetName(i);
            var value = reader.GetValue(i);

            if (value == DBNull.Value)
            {
                obj[key] = null;
            }
            else if (value is string s && s.StartsWith("JSON:"))
            {
                try
                {
                    var json = s.Substring(5);
                    obj[key] = JSON.Parse(json);
                }
                catch
                {
                    obj[key] = s.TryToNum();
                }
            }
            else
            {
                obj[key] = value.ToString().TryToNum();
            }
        }
        return obj;
    }


    public static Arr SQLQuery(string sql, object parameters = null, HttpContext context = null)
    {
        var paras = parameters == null ? Obj() : Obj(parameters);

        using var command = _db.CreateCommand();
        command.CommandText = sql;

    var entries = (Arr)paras.GetEntries();
foreach (var e in entries)
{
    var name = e[0]?.ToString() ?? "";
    var val = e[1];
    if (string.IsNullOrWhiteSpace(name)) continue;

    void TryAdd(string n)
    {
        if (!command.Parameters.Contains(n))
            command.Parameters.AddWithValue(n, val ?? DBNull.Value);
    }


    TryAdd(name);


    if (!name.StartsWith("$") && !name.StartsWith("@") && !name.StartsWith(":"))
    {
        TryAdd("$" + name);
        TryAdd("@" + name);
        TryAdd(":" + name);
    }
}

        if (context != null)
        {
            DebugLog.Add(context, new
            {
                sqlQuery = sql.Regplace(@"\s+", " "),
                sqlParams = paras
            });
        }

        var rows = Arr();
        try
        {
            if (sql.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                using var reader = command.ExecuteReader();
                while (reader.Read())
                    rows.Push(ObjFromReader(reader));
            }
            else
            {
                var affected = command.ExecuteNonQuery();
                rows.Push(new { command = sql.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0].ToUpper(), rowsAffected = affected });
            }
        }
        catch (Exception err)
        {
            var msg = err.Message;
            if (msg.Contains("'"))
            {
                try { msg = msg.Split('\'')[1]; } catch { }
            }
            rows.Push(new { error = msg });
        }

        return rows;
    }

    // Kör och ta första raden (eller ett error-objekt om tomt)
    public static dynamic SQLQueryOne(string sql, object parameters = null, HttpContext context = null)
    {
        var list = SQLQuery(sql, parameters, context);
        // Vissa anrop förväntar "error" vid 0 rader – returnera ett error-objekt då
        if (list == null || list.Length == 0)
            return Obj(new { error = "no rows" });
        return list[0];
    }
}
