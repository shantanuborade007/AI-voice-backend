export PGPASSWORD="postgres"

echo "Starting DB migrations..."
for file in ./migrations/*.sql; do
  echo "Running $file"
  psql \
    -h "localhost" \
    -p "5432" \
    -U "postgres" \
    -d "smb_voice_platform" \
    -f "$file"
done
echo "All migrations completed successfully"
