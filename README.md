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

### Asset images

Assets support an optional image when creating or editing, and an image gallery on the detail page.
JPG, PNG and WebP files up to 20 MiB are supported. The first image becomes the primary image;
additional images can be selected as the primary image from the gallery.

Images use the existing private document API and item links, not public storage URLs or database
file bytes. Unlinking an image preserves the original document. Archived assets are read-only.
If metadata is saved but an image upload fails, the detail page reports the partial result so the
user can retry the image without creating another asset.

Run the frontend tests with `npm test -- --watch=false` in `src/frontend`. Private-image API flow
tests are included in `dotnet test tests/Mira.API.Tests/Mira.API.Tests.csproj`.

### Contracts, warranties and documents

The frontend provides searchable overviews, create/edit forms, details and archive/restore actions
for assets, subscriptions, contracts, warranties and documents. Dashboard counts, recent items and
upcoming deadlines link to their corresponding pages.

Warranties require an owned asset. Asset details show linked warranties and documents, and allow
adding either with the relationship already selected. Subscriptions can select or clear a contract.
Documents support uploads, metadata editing, type filters, protected downloads, PDF/image previews
and links to multiple assets, subscriptions, contracts or warranties. Permanent document deletion
requires archiving first and explicit confirmation. Uploads support PDF, PNG, JPEG, WebP, DOCX,
XLSX and TXT, with a default limit of 20 MiB.

The shared blue interface uses 4–6 px corners, compact controls and tables, and responsive navigation.
Registration requires at least 8 characters, without mandatory uppercase, lowercase, digit, special
character or distinct-character combinations. The existing failed-login lockout remains enabled.
Restart the API after changing the Identity configuration.

Validation: `npm run build` and `npm test -- --watch=false` from `src/frontend`, plus
`dotnet test Mira.slnx -c Release` from the repository root. Release builds avoid locking the output
of an API instance being debugged in Visual Studio.

## Development guidelines

- Keep domain rules independent from ASP.NET Core and database concerns.
- Put API request and response models in `Mira.Contracts`.
- Put persistence and integrations in `Mira.Infrastructure`.
- Add test projects below `tests/` when the first domain or application behavior is introduced.
- Never commit secrets, local environment files or generated build output.
