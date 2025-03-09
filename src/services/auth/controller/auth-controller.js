import {
  registerUser,
  login,
  verifyEmail,
  refreshAccessToken,
  logout,
} from "../service/authService";

export const register = async (req, res) => {
  try {
    const { email, password, fullname } = req.body;
    const result = registerUser(email, fullname, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const result = await verifyEmail(token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { userId, refreshToken } = req.body;
    const tokens = await refreshAccessToken(userId, refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await logout(req.user.sub);
    res.json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
