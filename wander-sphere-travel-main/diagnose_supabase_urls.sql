-- The "Detective" Script 🕵️‍♂️ (Result Returning Version)

CREATE OR REPLACE FUNCTION audit_supabase_urls()
RETURNS TABLE(table_name text, column_name text, match_count bigint) AS $$
DECLARE
    t_rec record;
    c_rec record;
    cnt bigint;
    q text;
BEGIN
    FOR t_rec IN 
        SELECT information_schema.tables.table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        FOR c_rec IN 
            SELECT information_schema.columns.column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND information_schema.columns.table_name = t_rec.table_name 
              AND data_type IN ('text', 'character varying', 'character')
        LOOP
            q := format('SELECT count(*) FROM %I.%I WHERE %I LIKE ''%%supabase.co%%''', 'public', t_rec.table_name, c_rec.column_name);
            EXECUTE q INTO cnt;

            IF cnt > 0 THEN
                table_name := t_rec.table_name;
                column_name := c_rec.column_name;
                match_count := cnt;
                RETURN NEXT;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM audit_supabase_urls();
