using System.Text.Json;
using System.Text.Json.Serialization;
using Biin.Api.Extensions;
using Biin.Api.Middleware;
using Biin.Application;
using Biin.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

const string PoliticaFrontend = "frontend";

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAutenticacionJwt(builder.Configuration);
builder.Services.AddAutorizacionPorRoles();
builder.Services.AddRateLimitingBiin(builder.Configuration);

// Los enums viajan como texto en snake_case, igual que en la base: "cancelado", "en_curso"
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower)));
builder.Services.AddOpenApi();

builder.Services.AddCors(o => o.AddPolicy(PoliticaFrontend, p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ManejoErroresMiddleware>();
app.UseMiddleware<HeadersSeguridadCacheMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors(PoliticaFrontend);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Permite que Biin.IntegrationTests levante la API con WebApplicationFactory
public partial class Program;
