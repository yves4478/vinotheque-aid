-- Enforce the app-level 3-image limit in the database for new and updated rows.
ALTER TABLE "wines"
  ADD CONSTRAINT "wines_images_array_limit_check"
  CHECK (
    "images" IS NULL
    OR (
      jsonb_typeof("images") = 'array'
      AND jsonb_array_length("images") <= 3
    )
  ) NOT VALID;

ALTER TABLE "wines"
  ADD CONSTRAINT "wines_images_payload_limit_check"
  CHECK (
    "images" IS NULL
    OR octet_length("images"::text) <= 3145728
  ) NOT VALID;

ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_images_array_limit_check"
  CHECK (
    "images" IS NULL
    OR (
      jsonb_typeof("images") = 'array'
      AND jsonb_array_length("images") <= 3
    )
  ) NOT VALID;

ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_images_payload_limit_check"
  CHECK (
    "images" IS NULL
    OR octet_length("images"::text) <= 3145728
  ) NOT VALID;
