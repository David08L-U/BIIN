using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Biin.Infrastructure.Persistence.Configurations;

/// <summary>Guarda un enum como texto en snake_case: EnCurso se guarda como en_curso.</summary>
public class SnakeCaseEnumConverter<TEnum>() : ValueConverter<TEnum, string>(
    valor => ASnakeCase(valor.ToString()),
    texto => Enum.Parse<TEnum>(texto.Replace("_", string.Empty), true))
    where TEnum : struct, Enum
{
    private static string ASnakeCase(string nombre)
    {
        var sb = new StringBuilder(nombre.Length + 4);
        for (var i = 0; i < nombre.Length; i++)
        {
            var c = nombre[i];
            if (char.IsUpper(c) && i > 0) sb.Append('_');
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}
