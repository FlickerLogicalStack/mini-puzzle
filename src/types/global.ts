import type { create_engine_context } from '../engine/engine';
import type { Board } from '../game/entities/board/board';
import type { GridSpec } from '../game/entities/board/board.layout';
import type { Camera } from '../game/entities/camera/camera';
import type { Hud } from '../game/entities/hud/hud';

declare global {
  namespace PUZZLE {
    type EngineContext = ReturnType<typeof create_engine_context>;

    type DragState = {
      active: boolean;
      piece_id: number;
      offset_x: number;
      offset_y: number;
      moved: boolean;
    };

    type GameState = {
      source: CanvasImageSource | null;
      source_width: number;
      source_height: number;
      board: Board | null;
      camera: Camera;
      hud: Hud;
      drag: DragState;
      target: boolean;
      solved: boolean;
      moves: number;
      elapsed_ms: number;
      grid: GridSpec;
    };
  }

  interface Window {
    __ENGINE__?: { engine: PUZZLE.EngineContext; game: unknown };
  }
}
