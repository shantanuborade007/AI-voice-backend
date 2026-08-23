Follow the instructions in this file to set up and use the database for this project.
And be very careful as this is manual and needs extreme CAUTION while performing the steps.

Any mistake can lead to loss of data or corruption of the database.

Use this command to apply sql set for local
psql postgres://postgres:postgres@localhost:5432/smb_voice_platform -f db/migrations/<filename>.sql

Use this command to apply sql set for dev/prod
psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require" -f db/migrations/<filename>.sql

Or, to apply everything in order in one go (local only):
cd db && ./local-apply.sh


                        ***VERY IMPORTANT INSTRUCTIONS:***
ALWAYS TAKE A BACKUP OF THE DATABASE BEFORE APPLYING ANY MIGRATIONS OR MAKING ANY CHANGES and
ALWAYS TEST THE MIGRATIONS LOCALLY BEFORE APPLYING THEM TO deployed DATABASE.
ALWAYS INSERT THE CURRENT FILE NAME AND TIMESTAMP IN THE schema_migrations TABLE AFTER APPLYING A MIGRATION.
