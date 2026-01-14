import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // contoh dummy user
  const user = {
    id: 1,
    email,
    role: "candidate", // or recruiter
  };

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    user,
  });
});
