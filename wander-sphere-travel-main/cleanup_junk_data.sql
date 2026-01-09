-- Clean up junk rows in trips table (invalid URLs)
DELETE FROM trips 
WHERE image_url IS NOT NULL 
AND image_url NOT LIKE 'http%' 
AND image_url != '';

-- Clean up posts with invalid images
DELETE FROM posts 
WHERE image_url IS NOT NULL 
AND image_url NOT LIKE 'http%' 
AND image_url != '';

-- Clean up orphaned participants (pointing to deleted trips)
DELETE FROM trip_participants 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Clean up orphaned requests
DELETE FROM trip_requests 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Optional: Clean up specific test string 'dfgh' if present in other fields
DELETE FROM trips WHERE title = 'dfgh';
