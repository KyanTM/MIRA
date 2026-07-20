# MIRA — blijvende projectcontext

Gebruik deze context bij alle werkzaamheden in deze repository. Dit document beschrijft de productvisie en technische richting, maar is op zichzelf geen opdracht om code te wijzigen. Een concrete gebruikersvraag bepaalt telkens de scope.

## Productvisie

**MIRA** staat voor **My Information & Records Archive**. Het is een persoonlijke, veilige webapplicatie waarin een gebruiker belangrijke administratieve informatie, documenten en gegevens centraal bewaart, structureert, onderling verbindt en opvolgt.

MIRA is nadrukkelijk meer dan cloudopslag: een document heeft betekenis, metadata en relaties. Een factuur kan bijvoorbeeld gekoppeld zijn aan een aankoop, bezitting, verkoper, garantie, serienummer en onderhoudsrecord. De applicatie helpt bovendien actief met deadlines, vervaldata, verlengingen, opzegtermijnen, betalingen en onderhoud.

De initiële doelgroep bestaat uit individuele gebruikers met elk een strikt afgeschermde omgeving. Gedeelde huishoudens kunnen later volgen, maar mogen de eerste architectuur niet onnodig complex maken.

Belangrijke productprincipes:

- gegevens en documenten zijn betekenisvol en onderling koppelbaar;
- de gebruiker ziet snel wat aandacht nodig heeft;
- de interface blijft rustig, professioneel, toegankelijk en overzichtelijk;
- privacy en backend-autorisatie zijn fundamenteel;
- de architectuur is uitbreidbaar zonder overengineering;
- archiveren heeft vaak de voorkeur boven onmiddellijk permanent verwijderen.

## Domein

De belangrijkste mogelijke onderdelen zijn:

- dashboard;
- documenten;
- bezittingen (`Asset`);
- garanties (`Warranty`);
- contracten (`Contract`);
- abonnementen (`Subscription`);
- verzekeringen (`Insurance`);
- onderhoud (`MaintenanceRecord`);
- herinneringen (`Reminder`);
- categorieën, tags, zoeken, filters en tijdlijnen.

Veelvoorkomende gedeelde eigenschappen zijn `Id`, `UserId`, `Name`, `Description`, `CreatedAt`, `UpdatedAt` en `Status`. De hoofdtypes erven van een abstracte `Item`-basisklasse en gebruiken EF Core Table-per-Type (TPT). Daardoor bewaart de centrale `Items`-tabel de gemeenschappelijke velden en krijgen concrete types een eigen tabel. Dit maakt betrouwbare algemene relaties naar een item mogelijk. Primaire sleutels zijn `Guid`-waarden.

Belangrijke relaties:

- een gebruiker bezit meerdere items en documenten;
- een bezitting kan meerdere documenten, garanties, verzekeringen, onderhoudsrecords en herinneringen hebben;
- een document kan waar logisch aan meerdere relevante items gekoppeld zijn;
- een contract kan aan een abonnement gekoppeld zijn;
- een item kan meerdere herinneringen en tags hebben;
- categorieën groeperen meerdere items.

Documentmetadata hoort in de database; het fysieke bestand kan lokaal worden opgeslagen tijdens ontwikkeling en later in object storage. Bestanden zijn nooit via voorspelbare publieke URL's toegankelijk. Elke download of bewerking vereist controle van eigendom/toegang in de backend.

## MVP

### Huidige implementatiescope

Beperk het huidige datamodel voorlopig tot `Asset`, `Subscription`, `Warranty`, `Contract` en `Document`, met `Item` als abstracte TPT-basisklasse. `ItemDocument` is de technische koppeltabel waarmee documenten, bijlagen en afbeeldingen aan elk item worden verbonden. Verzekeringen, onderhoud, herinneringen, categorieën en tags blijven onderdeel van de langetermijnvisie, maar worden pas toegevoegd wanneer de huidige verticale flow stabiel is.

Upload geen bestandsbytes rechtstreeks naar de relationele tabellen. Bewaar bestanden in private bestands- of objectopslag en bewaar in `Document` alleen de private opslagkey en veilige metadata. Afbeeldingen zijn documenten met een image-MIME-type en worden via `ItemDocumentRole` als hoofd- of galerijafbeelding gekoppeld.

De eerste bruikbare versie focust op:

1. accounts, authenticatie en een beveiligde gebruikersomgeving;
2. een dashboard met recente items, aankomende herinneringen, bijna verlopen items en eenvoudige statistieken;
3. documenten uploaden, bekijken/downloaden, wijzigen, zoeken, filteren, archiveren en verwijderen;
4. bezittingen beheren en documenten eraan koppelen;
5. garanties aan bezittingen koppelen en bijna-verlopen garanties signaleren;
6. herinneringen aan items koppelen, tonen, voltooien en uitstellen.

Contracten, abonnementen, verzekeringen en uitgebreider onderhoud volgen daarna. OCR, automatische classificatie, e-mailimport, exports, PWA/offlinegebruik, notificaties, QR-codes, een administratieve gezondheidsscore en gedeelde huishoudens zijn mogelijke latere uitbreidingen.

De gewenste eerste verticale flow is:

1. gebruiker meldt zich aan;
2. gebruiker maakt een bezitting aan;
3. gebruiker uploadt een factuur en koppelt die aan de bezitting;
4. gebruiker voegt een garantie toe;
5. MIRA toont alle gekoppelde gegevens op de detailpagina;
6. MIRA maakt een herinnering voor het einde van de garantie.

Geef een kleine, volledig werkende verticale flow voorrang boven veel half afgewerkte modules.

## Technische richting

Backend:

- C# en ASP.NET Core Web API;
- Entity Framework Core met een relationele database;
- authenticatie en autorisatie;
- dependency injection, validatie, logging en automatische tests;
- duidelijke scheiding tussen API/controllers, applicatielogica/services, domein en infrastructuur/persistence;
- entities niet rechtstreeks als API-response terugsturen.

Authenticatie wordt geïmplementeerd met **ASP.NET Core Identity**. Gebruik `Guid` als sleuteltype voor de Identity-gebruiker zodat `Item.UserId` en de gebruiker dezelfde sleutelvorm hebben. API-autorisatie en eigendomscontrole blijven altijd server-side verplicht.

Frontend:

- Angular en TypeScript;
- componentgebaseerde architectuur;
- reactive forms, routing, HTTP-services en route guards;
- responsive ontwerp voor desktop, tablet en smartphone;
- duidelijke formulieren, validatie, laadstatussen, lege toestanden, statuslabels, zoeken en resetbare filters;
- helderheid en gebruiksgemak gaan voor overmatige animatie of visuele effecten.

Frontend en backend communiceren via een REST API.

Gebruik expliciete DTO's per type en handeling waar nuttig, zoals `CreateAssetDto`, `UpdateAssetDto`, `AssetSummaryDto` en `AssetDetailDto`. DTO-inheritance is niet verplicht; beperkte herhaling is acceptabel wanneer dit API-contracten duidelijker en minder gekoppeld maakt.

## Beveiliging en privacy

MIRA kan gevoelige persoonlijke data bevatten. Houd daarom steeds rekening met:

- strikte gegevensisolatie per gebruiker, ook en vooral in de backend;
- veilige wachtwoordopslag en authenticatie;
- validatie van alle invoer;
- controle van uploadtype en bestandsgrootte;
- niet-publieke bestandsopslag;
- geen geheimen in de repository;
- foutmeldingen zonder interne of gevoelige informatie;
- veilige back-ups;
- toekomstige export en verwijdering van gebruikersdata.

Een verborgen frontendknop is nooit een autorisatiecontrole. Elke actie moet server-side worden geautoriseerd.

## Ontwikkel- en kwaliteitsprincipes

MIRA is het vaste vakantieproject van 2026 en een serieus portfolio-project. Het moet professionele kennis aantonen van ASP.NET Core, C#, EF Core, relationele databases, Angular, TypeScript, REST API's, authenticatie/autorisatie, uploads, complexe relaties, validatie, testing, responsive UI, architectuur, Git, documentatie, beveiliging en privacy.

Werk stap voor stap:

- leg eerst een stabiele, duidelijke domeinstructuur;
- bouw daarna kleine end-to-end flows;
- voeg modules geleidelijk toe;
- refactor alleen met een concrete reden;
- vermijd onnodige abstracties en overengineering;
- gebruik professionele patronen waar ze werkelijk waarde toevoegen.

Streef naar duidelijke naamgeving, consistente structuur, kleine begrijpelijke componenten, gescheiden verantwoordelijkheden, centrale foutafhandeling, logging, invoervalidatie, migrations, ontwikkel-seeddata, een duidelijke README en API-documentatie. Voeg unit-, integratie- en frontendtests toe in verhouding tot het risico, met prioriteit voor kritieke flows.

## UX-richting

De applicatie moet modern, professioneel en rustig aanvoelen. Belangrijke schermen tonen vooral wat op dat moment relevant is. Detailpagina's brengen algemene informatie, documenten, relaties, herinneringen, notities en eventueel een tijdlijn samen, en maken het eenvoudig om gerelateerde items te openen of toe te voegen.

MIRA moet uiteindelijk aanvoelen als het centrale archief voor alle belangrijke persoonlijke informatie en administratie van de gebruiker: niet alleen weten waar iets staat, maar ook wat het betekent, waarmee het verbonden is en wanneer actie nodig is.
