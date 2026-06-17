-- Insert test users
INSERT INTO users (username, email, password_hash, bio, role) VALUES
('admin', 'admin@forum.com', 'cc5fb8d897d3eb26b5db58f13bdcd1eeca1f4c0d19aa81e34f9f36825e52aca52893cf34c64d4c3f2cbcd12f04bc25e4cdab11fba2da60f3f3aee2b4cd3d4f46', 'Forum Administrator', 'admin'),
('john_doe', 'john@example.com', 'cc5fb8d897d3eb26b5db58f13bdcd1eeca1f4c0d19aa81e34f9f36825e52aca52893cf34c64d4c3f2cbcd12f04bc25e4cdab11fba2da60f3f3aee2b4cd3d4f46', 'I love JavaScript and web development!', 'user'),
('jane_smith', 'jane@example.com', 'cc5fb8d897d3eb26b5db58f13bdcd1eeca1f4c0d19aa81e34f9f36825e52aca52893cf34c64d4c3f2cbcd12f04bc25e4cdab11fba2da60f3f3aee2b4cd3d4f46', 'Full-stack developer interested in backend systems', 'user'),
('bob_wilson', 'bob@example.com', 'cc5fb8d897d3eb26b5db58f13bdcd1eeca1f4c0d19aa81e34f9f36825e52aca52893cf34c64d4c3f2cbcd12f04bc25e4cdab11fba2da60f3f3aee2b4cd3d4f46', 'DevOps enthusiast', 'user');

-- Insert tags
INSERT INTO tags (name) VALUES
('JavaScript'),
('Database'),
('Performance'),
('Security'),
('Help'),
('Tutorial'),
('News'),
('Discussion');

-- Insert test topics
INSERT INTO topics (title, body, author_id, state, visibility) VALUES
('Getting Started with Node.js', 'Node.js is a powerful runtime for building server-side applications. This topic covers the basics...', 1, 'ouvert', 'public'),
('Database Optimization Tips', 'Learn how to optimize your database queries for better performance...', 2, 'ouvert', 'public'),
('Security Best Practices', 'Essential security practices for web applications...', 3, 'ouvert', 'public'),
('React vs Vue', 'Comparing different frontend frameworks...', 4, 'ouvert', 'public'),
('Private Discussion', 'This is a private topic for testing', 1, 'ouvert', 'private');

-- Insert test messages
INSERT INTO messages (topic_id, author_id, body) VALUES
(1, 2, 'Great introduction! I found this very helpful for beginners.'),
(1, 3, 'Can you provide more examples?'),
(2, 4, 'These tips really improved my query performance!'),
(3, 1, 'Security is paramount in web development.'),
(4, 2, 'I prefer React for its ecosystem.'),
(4, 3, 'Vue is more lightweight and easier to learn.');

-- Link topics to tags
INSERT INTO topic_tags (topic_id, tag_id) VALUES
(1, 1), (1, 6),
(2, 2), (2, 3),
(3, 4),
(4, 1), (4, 8),
(5, 1), (5, 5);

-- NOTE: Password hash above is SHA512 of "Password123!"
-- Use this for testing login
