-- SQL script to create the PeanutRoll orders table
-- Run this in your SQL Server Management Studio

USE SecurityAgency;

-- Drop table if it exists (for fresh setup)
-- IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.tblPeanutRollOrders') AND type in (N'U'))
-- DROP TABLE [dbo].[tblPeanutRollOrders]

-- Create the PeanutRoll Orders table
CREATE TABLE tblPeanutRollOrders (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Optional: Create an index on created_at for better query performance
CREATE INDEX IX_PeanutRoll_CreatedAt ON tblPeanutRollOrders(created_at DESC);
