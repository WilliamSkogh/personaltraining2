import express from "express";
import workoutRoutes from "./routes/workoutRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use("/api/workouts", workoutRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
