// Delete workspace
app.delete("/api/workspaces/:id", async (req, res) => {
  const { id } = req.params;
  const userId = "00000000-0000-0000-0000-000000000001"; // TODO: Get from auth

  try {
    // Check if user is owner of the workspace
    const memberResult = await pool.query(
      `SELECT role FROM workspace_members 
       WHERE workspace_id = $1 AND profile_id = $2`,
      [id, userId]
    );

    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== "owner") {
      return res.status(403).json({ error: "Not authorized to delete this workspace" });
    }

    // Delete workspace (cascade will handle related records)
    await pool.query("DELETE FROM workspaces WHERE id = $1", [id]);

    res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
}); 