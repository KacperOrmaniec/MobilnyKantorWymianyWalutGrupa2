# Etap 1: budowanie i publikacja API.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Najpierw sam csproj, żeby warstwa z pakietami NuGet była cache'owana.
COPY src/Kantor.Api/Kantor.Api.csproj src/Kantor.Api/
RUN dotnet restore src/Kantor.Api/Kantor.Api.csproj
COPY src/Kantor.Api/ src/Kantor.Api/
RUN dotnet publish src/Kantor.Api/Kantor.Api.csproj -c Release -o /app --no-restore

# Etap 2: lekki obraz uruchomieniowy (nasłuch na porcie 8080).
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Kantor.Api.dll"]
