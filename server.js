const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const config = {
    user:     "sa",
    password: "241",
    server:   "DESKTOP-MT8IR3T",
    database: "SecurityAgency",
    options:  { encrypt: false, trustServerCertificate: true }
};

let pool;
async function getPool() {
    if (!pool) pool = await sql.connect(config);
    return pool;
}

function ok(res, data) { return res.json({ success: true, ...data }); }
function err(res, msg, code) { return res.status(code || 400).json({ success: false, message: msg }); }

// GET all orders
app.get("/api/peanut-roll", async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request()
            .query("SELECT id, name, quantity, created_at FROM tblPeanutRollOrders ORDER BY created_at DESC");
        return ok(res, { data: result.recordset });
    } catch (e) {
        console.error("Fetch orders error:", e);
        return err(res, "Server error.", 500);
    }
});

// POST new order
app.post("/api/peanut-roll", async (req, res) => {
    const { name, quantity } = req.body;
    
    if (!name || !quantity) {
        return err(res, "Name and quantity are required.");
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
        return err(res, "Quantity must be a positive number.");
    }

    try {
        const db = await getPool();
        const result = await db.request()
            .input("name",     sql.VarChar(100), name.trim())
            .input("quantity", sql.Int,          qty)
            .query("INSERT INTO tblPeanutRollOrders (name, quantity) VALUES (@name, @quantity); SELECT SCOPE_IDENTITY() AS id");
        
        const orderId = result.recordset[0].id;
        return ok(res, {
            message: "Order submitted successfullyyyyyy.",
            id: orderId,
            name: name.trim(),
            quantity: qty
        });
    } catch (e) {
        console.error("Submit order error:", e);
        return err(res, "Server error.", 500);
    }
});

// DELETE order
app.delete("/api/peanut-roll/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return err(res, "Order ID is required.");
    }

    try {
        const db = await getPool();
        const result = await db.request()
            .input("id", sql.Int, parseInt(id))
            .query("DELETE FROM tblPeanutRollOrders WHERE id = @id");

        if (result.rowsAffected[0] === 0) {
            return err(res, "Order not found.", 404);
        }

        return ok(res, { message: "Order cancelled successfully." });
    } catch (e) {
        console.error("Cancel order error:", e);
        return err(res, "Server error.", 500);
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
