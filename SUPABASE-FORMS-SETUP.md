# Supabase forms integration

The Google Forms links have been removed from both the root site and the Render-served `server/public` copy.

## One required step
Open `js/supabase-client.js` and replace:
- `YOUR-PROJECT-REF` with your Supabase project URL
- `YOUR_SUPABASE_ANON_PUBLIC_KEY` with the Supabase **anon/public** key

Do the same in `server/public/js/supabase-client.js`.

Do NOT use the `service_role` key in browser code.

## Expected columns
`suggestions`: `name`, `email`, `message`

`join_applications`: `name`, `email`, `phone`, `major`, `message`

If your existing columns have different names, change the payload keys in `js/script.js` and `server/public/js/script.js` to match them.

RLS must allow INSERT for `anon` on both tables.
