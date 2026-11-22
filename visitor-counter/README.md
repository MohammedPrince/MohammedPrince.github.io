# Visitor counter

`counter.php` keeps the number of visits in `counter.txt`. GitHub Pages cannot run PHP or save files,
so this folder must live on your own hosting (cPanel).

1. Upload `counter.php` and `counter.txt` to a folder on your hosting, for example `public_html/visitor-counter/`.
   The address must be **https** and `counter.txt` must be writable by PHP (permission 644 is normally enough).
2. Open `https://YOUR-DOMAIN/visitor-counter/counter.php`. You should see `{"count":141}`.
3. In the site editor: **Contact & footer** → **Visitor counter address** → paste that address → **Publish**.

The counter stays hidden until the address is set. To change the number, edit `counter.txt`.
