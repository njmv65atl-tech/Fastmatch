cp /tmp/index.ts ~/Fast-Match-node/src/controllers/api/v1/admin/index.ts
cd ~/Fast-Match-node
npm run build
pm2 restart all
sudo cp -r /var/www/html/admin /var/www/html/admin_backup_$(date +%s)
sudo unzip -o /tmp/admin-dist.zip -d /var/www/html/admin/
