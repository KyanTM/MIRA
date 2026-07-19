# MIRA

MIRA (My Information & Records Archive) is a personal portfolio project for refreshing and demonstrating full-stack development with ASP.NET Core and Angular.

> The project is currently in its initial development phase.

## Architecture

MIRA is a monorepo: the backend and frontend belong to one product and are versioned together.

```text
MIRA/
|-- src/
|   |-- backend/
|   |   |-- Mira.API/
|   |   |-- Mira.Contracts/
|   |   |-- Mira.Domain/
|   |   |-- Mira.Infrastructure/
|   |   `-- Mira.Shared/
|   `-- frontend/
|-- Mira.slnx
|-- .editorconfig
|-- .gitignore
`-- README.md
```

### Backend projects

| Project | Responsibility |
| --- | --- |
| `Mira.API` | HTTP endpoints, request pipeline and application composition |
| `Mira.Contracts` | DTOs and public request/response contracts |
| `Mira.Domain` | Core entities and business rules |
| `Mira.Infrastructure` | Database access and external service implementations |
| `Mira.Shared` | Small cross-cutting types shared by multiple projects |

The project references follow the same boundaries as the CityInfo course project:

```text
Mira.API -> Mira.Contracts
Mira.API -> Mira.Infrastructure -> Mira.Domain
Mira.API -> Mira.Shared <- Mira.Infrastructure
```

## Run locally

### Backend

```powershell
dotnet restore .\Mira.slnx
dotnet run --project .\src\backend\Mira.API\Mira.API.csproj
```

The development API is available at `http://localhost:5155` and `https://localhost:7082`.

### Frontend

```powershell
cd .\src\frontend
npm install
npm start
```

The Angular development server is available at `http://localhost:4200`.

## Development guidelines

- Keep domain rules independent from ASP.NET Core and database concerns.
- Put API request and response models in `Mira.Contracts`.
- Put persistence and integrations in `Mira.Infrastructure`.
- Add test projects below `tests/` when the first domain or application behavior is introduced.
- Never commit secrets, local environment files or generated build output.
