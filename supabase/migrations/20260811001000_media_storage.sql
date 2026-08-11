-- Task 2.11 — a private storage bucket for media, with access tied to the
-- owning record.
--
-- Files are stored under `<user_id>/<uuid>.<ext>`, so ownership is provable
-- from the path itself without a lookup. The bucket is private: there are no
-- public URLs, and reads go through signed URLs issued only to a caller these
-- policies already admit (entry-privacy).

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy media_objects_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy media_objects_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy media_objects_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy media_objects_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
