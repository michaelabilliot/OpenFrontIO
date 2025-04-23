import { GameView } from "../../../core/game/GameView";
import { TransformHandler } from "../TransformHandler";
import { Layer } from "./Layer";

export class CosmeticMapLayer implements Layer {
  private hasDrawnOnce = false; // Optimization

  constructor(
    private game: GameView,
    private transformHandler: TransformHandler,
  ) {}

  shouldTransform(): boolean {
    return true; // This layer needs to be transformed with the map
  }

  tick() {
    // If the cosmetic map just loaded, trigger a redraw by setting hasDrawnOnce to false
    if (!this.hasDrawnOnce && this.game.getIsCosmeticMapLoaded()) {
      // No need to do anything specific here, renderLayer will handle it
    }
  }

  redraw() {
    // Force redraw next time renderLayer is called if map is loaded
    if (this.game.getIsCosmeticMapLoaded()) {
      this.hasDrawnOnce = false;
    }
  }

  renderLayer(context: CanvasRenderingContext2D) {
    const image = this.game.getCosmeticMapImage();

    // Only draw if the image exists, is fully loaded
    if (
      this.game.getIsCosmeticMapLoaded() &&
      image &&
      image.complete &&
      image.naturalWidth > 0
    ) {
      // Apply same smoothing as terrain layer based on scale
      if (this.transformHandler.scale < 1) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "low";
      } else {
        context.imageSmoothingEnabled = false;
      }

      // REMOVED: context.globalAlpha = 0.6; // Make it slightly transparent

      context.drawImage(
        image,
        -this.game.width() / 2, // Adjust coordinates because transform is applied
        -this.game.height() / 2,
        this.game.width(),
        this.game.height(),
      );

      // REMOVED: context.globalAlpha = 1.0; // Reset alpha (no longer needed as we didn't change it)
      this.hasDrawnOnce = true; // Mark as drawn
    }
    // Note: We don't *need* to redraw every frame if the map/view hasn't changed significantly,
    // but for simplicity, we draw it. Optimizations could involve checking transformHandler.hasChanged().
  }
}
