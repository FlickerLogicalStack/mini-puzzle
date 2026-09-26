import type { create_engine_context } from '@src/core/engine/engine';
import type { Board } from '@src/core/board/board';
import type { GridSpec } from '@src/core/board/board.layout';
import type { Camera } from '@src/core/camera/camera';
import type { DebugHud } from '@src/core/debug_hud/debug_hud';

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
      debug_hud: DebugHud;
      drag: DragState;
      target: boolean;
      solved: boolean;
      moves: number;
      elapsed_ms: number;
      grid: GridSpec;
    };
  }
}
