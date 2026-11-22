using Biin.Api.Extensions;
using Biin.Api.Middleware;
using Biin.Application;
using Biin.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

const string PoliticaFrontend = "frontend";

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAutenticacionJwt(builder.Configuration);
builder.Services.AddRateLimitingBiin(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(o => o.AddPolicy(PoliticaFrontend, p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ManejoErroresMiddleware>();

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
