USE NeuroNoteDb;
GO

INSERT INTO Users (FullName, Email, PasswordHash)
VALUES
('Admin User', 'admin@neuronote.local', 'PLACEHOLDER_HASH'),
('Test User', 'test@neuronote.local', 'PLACEHOLDER_HASH');
GO

INSERT INTO Notes (UserId, Title, Content)
VALUES
(1, 'Welcome to NeuroNote', 'Your full-stack project is now initialized.'),
(2, 'Team Collaboration', 'Frontend, backend, and database are now separated cleanly.');
GO
