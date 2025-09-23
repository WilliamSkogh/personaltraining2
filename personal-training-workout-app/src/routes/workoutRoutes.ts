import { Router, Request, Response } from "express";
import WorkoutController from "../controllers/workoutController";

const router = Router();
const ctrl = new WorkoutController();

// POST /api/workouts
router.post("/", (req: Request, res: Response) => {
  const { name, duration, type } = req.body || {};
  if (!name || typeof duration !== "number" || !type) {
    return res.status(400).json({ error: "name, duration (number) och type krävs" });
  }
  const created = ctrl.createWorkout(name, duration, type);
  res.status(201).json(created);
});

// GET /api/workouts
router.get("/", (_req: Request, res: Response) => {
  res.json(ctrl.getWorkouts());
});

// PUT /api/workouts/:id
router.put("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Ogiltigt id" });

  const { name, duration, type } = req.body || {};
  try {
    const updated = ctrl.updateWorkout(
      id,
      name as string | undefined,
      typeof duration === "number" ? duration : undefined,
      type as string | undefined
    );
    res.json(updated);
  } catch (e: any) {
    res.status(404).json({ error: e?.message ?? "Not found" });
  }
});

// DELETE /api/workouts/:id
router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Ogiltigt id" });

  try {
    const result = ctrl.deleteWorkout(id);
    res.json(result);
  } catch (e: any) {
    res.status(404).json({ error: e?.message ?? "Not found" });
  }
});

export default router;
