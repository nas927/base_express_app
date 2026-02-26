DROP TABLE IF EXISTS Sess;
DROP TABLE IF EXISTS Users;

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    user_id INT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Sess (
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Activer RLS
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : chaque utilisateur voit ses propres données
CREATE POLICY utilisateur_select ON Users
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::INT);

-- Politique INSERT : les Users peuvent insérer leurs propres données
CREATE POLICY utilisateur_insert ON Users
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::INT);

-- Politique UPDATE : les Users ne peuvent modifier que leurs données
CREATE POLICY utilisateur_update ON Users
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::INT)
    WITH CHECK (user_id = current_setting('app.current_user_id')::INT);

-- Politique DELETE
CREATE POLICY utilisateur_delete ON Users
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id')::INT);