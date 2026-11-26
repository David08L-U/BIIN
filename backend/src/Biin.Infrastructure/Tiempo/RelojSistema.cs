using Biin.Application.Interfaces;

namespace Biin.Infrastructure.Tiempo;

public class RelojSistema : IReloj
{
    public DateTime AhoraUtc => DateTime.UtcNow;
}
