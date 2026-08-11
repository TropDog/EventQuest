Architecture Document v0.1 EventQuest LLM-ready architecture for
AI-assisted software development

# Architecture Document v0.1

# EventQuest

Źródło wymagań: PRD_v0.5.docx Produkt: EventQuest Typ produktu: SaaS /
Event Engagement Platform Tagline: Kahoot dla wesel, imprez i eventów
Cel dokumentu: zdefiniowanie architektury technicznej aplikacji w formie
zrozumiałej dla LLM generujących kod. \# 1. Cel Architektury
Architektura EventQuest ma umożliwić budowę aplikacji webowej, w której
organizator tworzy wydarzenie, uczestnicy dołączają przez QR Code,
wykonują zadania, przesyłają zdjęcia lub filmy, zdobywają punkty, a
ranking i widoki prowadzącego aktualizują się w czasie rzeczywistym.
System musi wspierać trzy główne role: Organizator, Prowadzący /
Koordynator oraz Gracz. Organizator posiada konto i jest właścicielem
wydarzenia, prowadzący korzysta z dedykowanego linku bez rejestracji, a
gracz dołącza bez konta poprzez QR Code, link lub kod pokoju. \# 2.
Decyzja Architektoniczna MVP \## Rekomendowany styl architektury Modular
Monolith + PostgreSQL + Object Storage + Real-Time Gateway \##
Uzasadnienie EventQuest ma wiele modułów, ale są one silnie powiązane
biznesowo: - wydarzenia - zadania - uczestnicy - drużyny - punkty -
ranking - multimedia - płatności - AI - Big Screen Mode Na etapie MVP
mikroserwisy zwiększyłyby złożoność bez wystarczającej korzyści.
Modularny monolit pozwala budować szybko, ale utrzymać czysty podział
domenowy. W przyszłości najbardziej obciążone moduły, takie jak media
upload, ranking realtime albo AI summary, można wydzielić jako osobne
usługi. \# 3. Rekomendowany Stack Technologiczny \## Frontend Next.js
React TypeScript Tailwind CSS PWA capabilities \## Backend NestJS
TypeScript REST API WebSocket Gateway \## Baza danych PostgreSQL Prisma
ORM \## Storage multimediów S3-compatible Object Storage Przykłady
dostawców: AWS S3 Azure Blob Storage Cloudflare R2 \## Kolejki i zadania
asynchroniczne Redis BullMQ \## Real-Time WebSockets Socket.IO albo
natywny WebSocket Gateway w NestJS \## Płatności Stripe na start W
Polsce docelowo można rozważyć: Przelewy24 PayU Tpay \## AI OpenAI API
albo Azure OpenAI \## Hosting MVP Najprostszy wariant: Frontend: Vercel
Backend: Render / Railway / Fly.io / Azure App Service Database: Managed
PostgreSQL Storage: S3 / Azure Blob / Cloudflare R2 Redis: Managed Redis
\## Hosting bardziej produkcyjny Azure App Service / Container Apps
Azure PostgreSQL Azure Blob Storage Azure Cache for Redis Azure OpenAI
Application Insights \# 4. High-Level Architecture \[Organizer Web App\]
\| \| HTTPS v \[Backend API - NestJS\] \| \| Prisma ORM v \[PostgreSQL
Database\]

\[Player Mobile Web App\] \| \| HTTPS + WebSocket v \[Backend API +
Real-Time Gateway\] \| \| Signed Upload URL v \[Object Storage\]

\[Coordinator Panel / Big Screen Mode\] \| \| WebSocket v \[Real-Time
Gateway\] \| v \[Ranking / Events / Gallery Updates\]

\[Backend Worker\] \| \| Async Jobs v \[Redis Queue\] \| v \[AI Summary
/ Media Packaging / Cleanup Jobs\] \# 5. Główne Aplikacje Frontendowe
System powinien mieć jedną aplikację frontendową z różnymi widokami
zależnymi od roli. \## 5.1 Organizer App Dostępna tylko dla zalogowanego
organizatora. Główne widoki: /register /login /dashboard /packages
/events/new /events/:eventId/settings /events/:eventId/tasks
/events/:eventId/teams /events/:eventId/live /events/:eventId/gallery
/events/:eventId/summary /events/:eventId/reports Odpowiedzialność: -
rejestracja i logowanie, - zakup pakietu, - tworzenie wydarzenia, -
konfiguracja gry, - konfiguracja zadań, - zaproszenie prowadzącego, -
monitoring rozgrywki, - pobranie raportu, - zamknięcie wydarzenia. \##
5.2 Player Mobile App Dostępna bez rejestracji, głównie na smartfonie.
Główne widoki: /join/:roomCode /player/onboarding /player/team-selection
/player/current-task /player/upload /player/ranking /player/achievements
/player/profile Odpowiedzialność: - wejście przez QR / link / kod
pokoju, - akceptacja regulaminu, - podanie nicku, - opcjonalny avatar, -
wybór drużyny, - wykonywanie zadań, - upload zdjęć i filmów, - ranking
TOP 10, - własny wynik, - osiągnięcia. \## 5.3 Coordinator Panel
Dostępny przez dedykowany link, bez rejestracji. Główne widoki:
/coordinator/:token /coordinator/:token/dashboard
/coordinator/:token/big-screen /coordinator/:token/gallery
/coordinator/:token/ranking /coordinator/:token/events
Odpowiedzialność: - wyświetlanie QR dla graczy, - wyświetlanie kodu
pokoju, - uruchamianie eventów specjalnych, - Big Screen Mode, - Summary
View, - Live Gallery, - komunikaty do uczestników. \## 5.4 Big Screen
Mode Widok zoptymalizowany pod ekran, projektor, TV lub screen sharing.
Główne widoki: /screen/:eventId/ranking /screen/:eventId/gallery
/screen/:eventId/summary /screen/:eventId/challenge
/screen/:eventId/event-alert Wymagania: - pełny ekran, - czytelne
fonty, - duże elementy UI, - automatyczne odświeżanie przez WebSocket, -
brak konieczności interakcji klawiaturą. \# 6. Moduły Backendowe Backend
powinien być modularny. Każdy moduł powinien mieć własne: controller
service repository dto entity/model guards/policies tests \## 6.1 Auth
Module Odpowiedzialność: - rejestracja organizatora, - logowanie
organizatora, - JWT session, - hash hasła, - obsługa tokenów
prowadzącego, - obsługa sesji gracza. Typy dostępu: Organizer: email +
password + JWT Coordinator: magic link / access token Player: guest
session token \## 6.2 Package & Payment Module Odpowiedzialność: - lista
pakietów, - zakup pakietu, - webhook płatności, - przypisanie pakietu do
organizatora, - walidacja limitu uczestników, - oznaczenie pakietu jako
wykorzystanego. Model biznesowy: 1 package purchase = 1 event = 1 room
\## 6.3 Event Module Odpowiedzialność: - tworzenie wydarzenia, -
konfiguracja wydarzenia, - status wydarzenia, - data startu, - data
zamknięcia, - generowanie room code, - generowanie QR Code, - zamykanie
wydarzenia. Statusy eventu: DRAFT CONFIGURED ACTIVE CLOSED ARCHIVED \##
6.4 Coordinator Module Odpowiedzialność: - generowanie linku
prowadzącego, - unieważnianie linku, - walidacja dostępu, - uprawnienia
prowadzącego, - dostęp do widoku QR dla graczy, - dostęp do Big Screen
Mode. \## 6.5 Player Module Odpowiedzialność: - dołączenie gracza do
pokoju, - akceptacja regulaminu, - nick, - avatar, - wybór drużyny, -
guest session token, - blokada zmiany nicku. Zasada: Zmiana nicku = nowy
gracz \## 6.6 Team Module Odpowiedzialność: - tworzenie drużyn dla
wydarzenia, - limity miejsc, - dołączanie graczy do drużyn, - blokada
drużyny po osiągnięciu limitu, - jednorazowa zmiana nazwy drużyny.
Zasada: Każda drużyna może zmienić nazwę maksymalnie jeden raz. \## 6.7
Task Module Odpowiedzialność: - tworzenie zadań, - edycja zadań, -
generowanie zadań przez AI, - sekwencyjna aktywacja, - zajawka
następnego zadania, - liczba pozostałych zadań. Typy zadań: QUIZ PHOTO
VIDEO TEXT GROUP TIMED \## 6.8 Submission Module Odpowiedzialność: -
zgłoszenia wykonania zadań, - walidacja typu zadania, - przyznawanie
punktów, - obsługa quizów, - obsługa uploadu mediów, - zapobieganie
spamowi. Zasada: Brak AI Vision w MVP. \## 6.9 Scoring Module
Odpowiedzialność: - naliczanie punktów, - bonusy eventów specjalnych, -
podwójne punkty, - punkty solo, - punkty drużynowe, - historia
punktacji. \## 6.10 Ranking Module Odpowiedzialność: - TOP 10, - własna
pozycja gracza, - ranking drużynowy, - publikacja zmian przez
WebSocket, - ranking dla Big Screen Mode. Ranking jest głównym
mechanizmem motywacyjnym produktu. \## 6.11 Achievement Module
Odpowiedzialność: - definicje osiągnięć, - przyznawanie osiągnięć, -
prezentacja osiągnięć graczowi, - prezentacja w Summary View. Przykłady:
Pierwsze Zadanie Król Selfie Pogromca Quizów Team Player Nocny Marek
Mistrz Integracji Łowca Flash Questów \## 6.12 Special Event Module
Odpowiedzialność: - Happy Hour, - Flash Quest, - Golden Quest, - Team
Challenge, - komunikaty realtime, - publikacja eventów do Big Screen
Mode. \## 6.13 Media Module Odpowiedzialność: - upload zdjęć, - upload
filmów, - generowanie signed upload URL, - zapis metadanych w bazie, -
podgląd galerii, - filtrowanie po zadaniu, - pakowanie materiałów do
pobrania, - usuwanie po retencji. Ważne: Pliki nie powinny przechodzić
przez backend jako binary stream, jeżeli da się tego uniknąć. Backend
powinien generować signed upload URL. Frontend uploaduje bezpośrednio do
Object Storage. Backend zapisuje metadane. \## 6.14 AI Module
Odpowiedzialność: - generowanie listy zadań, - sugerowana punktacja, -
propozycje eventów specjalnych, - AI Event Summary po wydarzeniu. AI nie
odpowiada za walidację zdjęć ani filmów w MVP. \## 6.15 Report Module
Odpowiedzialność: - generowanie podsumowania, - eksport statystyk, -
przygotowanie paczki mediów, - raport końcowy dla organizatora, -
uruchomienie procesu usunięcia materiałów po pobraniu. \## 6.16
Retention & Cleanup Module Odpowiedzialność: - usuwanie mediów po 30
dniach, - usuwanie mediów po wygenerowaniu i pobraniu raportu, -
pozostawienie logów technicznych i statystyk, - cykliczne joby cleanup.
Retencja multimediów wynosi maksymalnie 30 dni, a po wygenerowaniu
raportu multimedia mają zostać usunięte. \## 6.17 Notification /
Realtime Module Odpowiedzialność: - WebSocket rooms per event, -
aktualizacja rankingów, - nowe eventy specjalne, - nowe zdjęcia w
galerii, - komunikaty prowadzącego, - aktualne zadanie, - Big Screen
Mode. \# 7. Model Domenowy \## Główne encje OrganizerAccount
PackagePurchase Event CoordinatorAccess Player Team Task TaskSubmission
MediaAsset ScoreTransaction RankingSnapshot Achievement
PlayerAchievement SpecialEvent AiGeneratedTaskSet EventSummary AuditLog
\# 8. Relacje Domenowe OrganizerAccount 1 - N PackagePurchase
OrganizerAccount 1 - N Event

PackagePurchase 1 - 1 Event

Event 1 - N CoordinatorAccess Event 1 - N Player Event 1 - N Team Event
1 - N Task Event 1 - N SpecialEvent Event 1 - N MediaAsset Event 1 - N
AuditLog

Team 1 - N Player

Task 1 - N TaskSubmission Player 1 - N TaskSubmission TaskSubmission 0 -
N MediaAsset

Player 1 - N ScoreTransaction Team 1 - N ScoreTransaction

Player 1 - N PlayerAchievement Achievement 1 - N PlayerAchievement

Event 1 - 1 EventSummary \# 9. Proponowany ERD Logic Level To nie jest
jeszcze pełny SQL, tylko logiczny model tabel. \## organizer_accounts id
email password_hash terms_accepted_at created_at updated_at \##
package_purchases id organizer_id package_type participant_limit
payment_status payment_provider payment_provider_session_id purchased_at
used_at created_at \## events id organizer_id package_purchase_id name
event_type room_code status game_mode participant_limit starts_at
closes_at closed_at created_at updated_at \## coordinator_accesses id
event_id token_hash is_active expires_at revoked_at created_at \##
players id event_id team_id nickname avatar_url guest_token_hash
terms_accepted_at joined_at last_seen_at created_at \## teams id
event_id name default_number max_players name_changed created_at
updated_at \## tasks id event_id sequence_number title description
teaser task_type points is_active activation_strategy time_limit_seconds
max_submissions_per_player starts_at ends_at created_at updated_at \##
task_submissions id event_id task_id player_id team_id submission_type
text_answer quiz_answer is_correct status points_awarded submitted_at
created_at \## media_assets id event_id task_submission_id player_id
media_type storage_key public_url thumbnail_url file_size_bytes
duration_seconds created_at deleted_at \## score_transactions id
event_id player_id team_id task_submission_id special_event_id points
reason created_at \## achievements id code name description icon
created_at \## player_achievements id event_id player_id achievement_id
awarded_at \## special_events id event_id type title description
multiplier starts_at ends_at created_by_coordinator_access_id
created_by_organizer_id created_at \## event_summaries id event_id
ai_summary_text report_url media_package_url generated_at downloaded_at
created_at \## audit_logs id event_id actor_type actor_id action
metadata_json created_at \# 10. Autoryzacja i Kontrola Dostępu \## 10.1
Organizator Mechanizm: Email + password JWT access token Refresh token
Organizator ma dostęp tylko do wydarzeń przypisanych do swojego konta.
Guard: OrganizerAuthGuard EventOwnerGuard \## 10.2 Prowadzący /
Koordynator Mechanizm: Magic link token Token zapisany jako hash w bazie
Token przypisany do jednego eventu Prowadzący nie ma konta. Guard:
CoordinatorAccessGuard Prowadzący może: read ranking read gallery
display QR trigger special events publish messages open Big Screen Mode
Prowadzący nie może: purchase package create event delete event download
final report manage payments change business settings \## 10.3 Gracz
Mechanizm: Guest session token Token przypisany do player_id i event_id
Gracz nie ma konta. Guard: PlayerSessionGuard Gracz może wykonywać
operacje tylko w kontekście własnego eventu i własnej sesji. \# 11.
Kluczowe Flows Systemowe \## 11.1 Organizator kupuje pakiet i tworzy
wydarzenie Organizer registers ↓ Organizer logs in ↓ Organizer selects
package ↓ Payment session is created ↓ Payment provider confirms payment
via webhook ↓ PackagePurchase is marked as PAID ↓ Organizer creates
Event using paid package ↓ PackagePurchase is marked as USED ↓ System
generates room_code and event QR \## 11.2 Gracz dołącza do wydarzenia
Player opens join link / scans QR ↓ System validates room_code ↓ System
checks event status and participant limit ↓ Player accepts terms ↓
Player enters nickname ↓ If team mode: Player selects available team ↓
System creates Player record ↓ System creates guest session token ↓
Player enters current task screen \## 11.3 Gracz wykonuje zadanie
zdjęciowe Player opens current task ↓ Player selects photo ↓ Frontend
requests signed upload URL ↓ Backend validates: event status player
session task active anti-spam rules ↓ Backend returns signed upload URL
↓ Frontend uploads file directly to Object Storage ↓ Frontend confirms
upload ↓ Backend creates TaskSubmission ↓ Backend creates MediaAsset ↓
Scoring Module awards points ↓ Ranking Module recalculates TOP 10 ↓
Realtime Module broadcasts ranking update ↓ Big Screen / Player views
update \## 11.4 Quiz submission Player submits answer ↓ Backend
validates active task ↓ Backend compares answer with correct answer ↓ If
correct: create submission award points update ranking If incorrect:
create submission or attempt record no points ↓ Realtime update if
points changed \## 11.5 Prowadzący uruchamia event specjalny Coordinator
opens panel via magic link ↓ Coordinator selects special event ↓ Backend
validates coordinator token ↓ Special event is created ↓ Realtime Module
broadcasts Event Alert ↓ Player screens receive update ↓ Big Screen Mode
displays event ↓ Scoring rules apply for event duration \## 11.6
Generowanie raportu końcowego Organizer closes event ↓ Organizer
requests final report ↓ Report job is queued ↓ Worker collects: rankings
submissions media metadata achievements special events ↓ AI Module
generates narrative summary ↓ Media package is prepared ↓ Report is
generated ↓ Organizer downloads report and media package ↓ Cleanup job
deletes multimedia after download ↓ System keeps logs and statistics \#
12. Real-Time Architecture \## Kanały WebSocket Każde wydarzenie powinno
mieć własny kanał realtime. event:{eventId}:players
event:{eventId}:coordinator event:{eventId}:big-screen
event:{eventId}:organizer \## Typy eventów realtime RANKING_UPDATED
TASK_UNLOCKED SPECIAL_EVENT_STARTED SPECIAL_EVENT_ENDED MEDIA_UPLOADED
ACHIEVEMENT_UNLOCKED ANNOUNCEMENT_PUBLISHED EVENT_CLOSED \## Zasada
Backend jest jedynym źródłem prawdy. Frontend nie liczy punktów
samodzielnie. \# 13. Media Upload Architecture \## Założenie Zdjęcia i
filmy są największym kosztem infrastruktury i największym ryzykiem
obciążeniowym. \## Rekomendowany flow Frontend -\> Backend: request
signed URL Backend -\> Storage: generate signed URL Frontend -\>
Storage: direct upload Frontend -\> Backend: confirm upload Backend -\>
DB: save metadata Backend -\> Realtime: broadcast MEDIA_UPLOADED \##
Dlaczego tak? - backend nie jest zapychany dużymi plikami, - łatwiej
skalować upload, - storage obsługuje ruch bezpośrednio, - łatwiej
wprowadzić limity rozmiaru i typu pliku. \## Limity MVP Proponowane
wartości startowe: Photo max size: 15 MB Video max size: 100 MB Video
max duration: 30 seconds Allowed photo formats: jpg, jpeg, png, webp
Allowed video formats: mp4, mov, webm \# 14. Anti-Spam Architecture
System nie używa AI Vision w MVP, więc walidacja zdjęć i filmów opiera
się na regułach technicznych. \## Reguły anti-spam Max submissions per
task per player Minimum cooldown between submissions Max media uploads
per minute per player Max failed quiz attempts per task Block duplicate
submission if max_submissions_per_player reached \## Przykładowe akcje
ALLOW WARN COOLDOWN TEMP_BLOCK \## Ważne Anti-spam nie powinien usuwać
zgłoszeń bez śladu. Każda blokada powinna zostać zapisana w audit logu.
\# 15. Offline First Offline First nie jest częścią MVP, ale
architektura powinna nie blokować tej funkcji w przyszłości. \##
Docelowe założenie Player can continue selected actions offline. Points
are visible to others only after successful sync. \## Implikacje
architektoniczne W przyszłości trzeba dodać: local task cache local
submission queue client-generated temporary IDs sync endpoint conflict
resolution upload retry mechanism \## Nie implementować w MVP Na start
wystarczy: online-only experience clear error when offline retry upload
if connection fails \# 16. AI Architecture \## 16.1 Generator zadań
Input: event_type participant_count age_range task_count party_style
energy_level game_mode Output: tasks\[\] special_event_suggestions\[\]
points_suggestions\[\] Ważne: AI generuje propozycje, ale organizator
zatwierdza i edytuje zadania przed publikacją. \## 16.2 AI Event Summary
Input: event metadata ranking team results task statistics achievement
statistics special events selected captions / text submissions Output:
narrative summary most active players most popular tasks team summary
interesting statistics \## Ważne ograniczenie AI Summary nie powinno
analizować twarzy ani identyfikować osób na zdjęciach. \# 17. Retention
Architecture \## Zasady Multimedia max retention = 30 days After report
generation and download = delete multimedia Keep logs and statistics \##
Joby cykliczne cleanupExpiredMediaJob cleanupDownloadedReportMediaJob
archiveClosedEventsJob deleteRevokedCoordinatorTokensJob \## Dane
zostające po usunięciu mediów event logs technical logs statistics
ranking summary task stats score transactions \# 18. Skalowalność \##
Największe ryzyka Many users uploading media at the same time Live
ranking updates for many clients Big Screen Mode during peak activity
Unlimited package AI summary generation for large events \##
Rekomendacje Direct-to-storage uploads Redis queue for heavy jobs
WebSocket rooms per event Database indexes on event_id Caching ranking
snapshots Async report generation Async AI summary generation CDN for
media previews \## Indeksy bazodanowe W bazie powinny istnieć indeksy
na: events.room_code players.event_id players.team_id tasks.event_id
tasks.sequence_number task_submissions.event_id task_submissions.task_id
task_submissions.player_id media_assets.event_id
score_transactions.event_id score_transactions.player_id
score_transactions.team_id special_events.event_id \# 19. Security
Requirements \## Hasła Passwords must be hashed with bcrypt or argon2.
Never store plain text passwords. \## Tokeny Coordinator tokens must be
stored as hashes. Guest session tokens must be stored as hashes. JWT
secret must be stored in environment variables. \## Upload Validate file
type Validate file size Validate duration for videos Use signed URLs
Never expose storage admin credentials to frontend \## Autoryzacja Każdy
endpoint musi sprawdzić: actor type event access role permissions event
status package limits \# 20. Suggested API Structure \## Auth POST
/auth/register POST /auth/login POST /auth/logout POST /auth/refresh GET
/auth/me \## Packages and Payments GET /packages POST /payments/checkout
POST /payments/webhook GET /package-purchases \## Events POST /events
GET /events GET /events/:eventId PATCH /events/:eventId POST
/events/:eventId/open POST /events/:eventId/close GET
/events/:eventId/qr \## Coordinator POST
/events/:eventId/coordinator-access DELETE
/events/:eventId/coordinator-access/:accessId GET /coordinator/:token
\## Players GET /join/:roomCode POST /events/:eventId/players GET
/players/me PATCH /players/me/avatar \## Teams GET
/events/:eventId/teams POST /events/:eventId/teams/:teamId/join PATCH
/events/:eventId/teams/:teamId/name \## Tasks GET /events/:eventId/tasks
POST /events/:eventId/tasks PATCH /events/:eventId/tasks/:taskId DELETE
/events/:eventId/tasks/:taskId GET /events/:eventId/current-task POST
/events/:eventId/tasks/generate-ai \## Submissions POST
/events/:eventId/tasks/:taskId/submissions POST
/events/:eventId/tasks/:taskId/submissions/media-upload-url POST
/events/:eventId/tasks/:taskId/submissions/confirm-media \## Ranking GET
/events/:eventId/ranking/top GET /events/:eventId/ranking/me GET
/events/:eventId/ranking/teams \## Special Events POST
/events/:eventId/special-events GET /events/:eventId/special-events POST
/events/:eventId/special-events/:specialEventId/end \## Gallery GET
/events/:eventId/gallery GET /events/:eventId/gallery?taskId= \##
Reports POST /events/:eventId/reports GET
/events/:eventId/reports/latest GET /events/:eventId/reports/download \#
21. Suggested Repository Structure eventquest/ apps/ web/ src/ app/
components/ features/ hooks/ lib/ styles/ api/ src/ modules/ auth/
packages/ payments/ events/ coordinator/ players/ teams/ tasks/
submissions/ scoring/ ranking/ achievements/ special-events/ media/ ai/
reports/ realtime/ retention/ common/ guards/ decorators/ filters/
interceptors/ pipes/ utils/ config/ main.ts packages/ shared/ src/
types/ enums/ schemas/ prisma/ schema.prisma migrations/ docs/ PRD.md
ARCHITECTURE.md DOMAIN_MODEL.md API_SPEC.md \# 22. Reguły dla LLM
Generującego Kod To możesz wkleić bezpośrednio do Cursora jako
instrukcję projektu. You are building EventQuest, a SaaS event
engagement platform based on the provided PRD and architecture.

Follow these rules strictly:

1.  Use TypeScript across frontend and backend.
2.  Use Next.js for frontend.
3.  Use NestJS for backend.
4.  Use PostgreSQL as the primary database.
5.  Use Prisma ORM.
6.  Use modular monolith architecture.
7.  Do not introduce microservices unless explicitly requested.
8.  Do not introduce MongoDB, Firebase, Supabase or other databases
    unless explicitly requested.
9.  Backend is the source of truth for scoring, ranking and task state.
10. Frontend must never calculate final points.
11. Media files must be uploaded directly to object storage using signed
    upload URLs.
12. The backend stores only media metadata and storage keys.
13. Organizer is the only role with a registered account.
14. Coordinator uses magic link access and does not register.
15. Player uses guest session and does not register.
16. Player nickname cannot be changed after joining.
17. Tasks are sequential.
18. Ranking shows TOP 10 and current player’s own position.
19. No AI Vision is used in MVP.
20. AI can generate task suggestions and event summaries only.
21. Offline-first is not part of MVP, but code should not block future
    offline synchronization.
22. Use clean module boundaries.
23. Every module should have DTOs, services, controllers and tests where
    applicable.
24. Validate role permissions on every endpoint.
25. Do not hardcode package limits. Use package configuration.
26. Keep all domain enums in shared package. \# 23. MVP Scope \## Must
    Have Organizer registration and login Package selection and payment
    placeholder / integration Create event Generate room code and QR
    Configure solo or team mode Create teams Player join flow Player
    accepts terms Player selects nickname Player selects team if team
    mode Create and edit tasks Sequential task display Submit quiz
    answer Submit photo Submit video Automatic scoring TOP 10 ranking
    Big Screen ranking Coordinator magic link Coordinator QR display
    Coordinator special events Live Gallery Final report generation
    basic version Media retention cleanup \## Should Have AI task
    generator Achievements Summary View AI Event Summary Media zip
    export Anti-spam cooldown \## Could Have Advanced animations
    Multiple visual themes Advanced achievement rules Offline mode
    Advanced moderation \## Not MVP AI Vision Face recognition Native
    mobile app Full offline-first Microservices Unlimited scaling
    guarantees Advanced admin panel \# 24. Najważniejsze Decyzje
    Architektoniczne \## ADR-001: Modular Monolith System będzie
    budowany jako modularny monolit, nie jako mikroserwisy. \## ADR-002:
    PostgreSQL jako główna baza Relacyjny model danych jest naturalny
    dla eventów, graczy, drużyn, zadań, punktów i płatności. \##
    ADR-003: Direct-to-storage media upload Pliki multimedialne nie
    powinny obciążać backendu. \## ADR-004: WebSocket for real-time
    Ranking, eventy specjalne i Big Screen Mode wymagają komunikacji
    realtime. \## ADR-005: Organizer jako jedyny zarejestrowany
    użytkownik Prowadzący i gracz działają bez konta, przez tokeny
    dostępu. \## ADR-006: Server-side scoring Punkty i ranking są
    liczone wyłącznie po stronie backendu. \## ADR-007: No AI Vision in
    MVP AI nie waliduje zdjęć ani filmów. \# 25. Co powinno powstać jako
    następny dokument Po tej architekturze kolejny najbardziej użyteczny
    dokument to: DOMAIN_MODEL.md Czyli dokładny opis encji, relacji,
    statusów, enumów i reguł biznesowych. Potem: ERD.md API_SPEC.md
    MVP_BACKLOG.md UI_FLOWS.md Najbardziej praktyczna kolejność pod AI
    development:
27. PRD
28. Architecture Document
29. Domain Model
30. ERD
31. API Spec
32. MVP Backlog
33. UI Flows
34. Implementation Plan \## Krótko mówiąc To jest architektura, która
    mówi AI: Nie kombinuj. Budujemy modularny monolit w TypeScript, z
    Next.js, NestJS, PostgreSQL, Object Storage, WebSocketami i jasnym
    podziałem ról. Dzięki temu LLM generujące kod będzie miało jasne
    granice: co jest frontendem, co backendem, gdzie liczymy punkty, jak
    działają role, jak uploadujemy media i czego nie wolno robić w MVP.

| Źródło wymagań | PRD_v0.5.docx                      |
|----------------|------------------------------------|
| Produkt        | EventQuest                         |
| Typ produktu   | SaaS / Event Engagement Platform   |
| Tagline        | Kahoot dla wesel, imprez i eventów |
