import { GameMapType } from "./Game";
import { NationMap } from "./TerrainMapLoader";

interface MapData {
  mapBin: string;
  miniMapBin: string;
  nationMap: NationMap;
  cosmeticMapImageUrl?: string;
}

interface MapCache {
  bin?: string;
  miniMapBin?: string;
  nationMap?: NationMap;
  cosmeticMapImageUrl?: string;
}

interface BinModule {
  default: string;
}

interface NationMapModule {
  default: NationMap;
}

// Mapping from GameMap enum values to file names
const MAP_FILE_NAMES: Record<GameMapType, string> = {
  [GameMapType.World]: "WorldMap",
  [GameMapType.Europe]: "Europe",
  [GameMapType.Mena]: "Mena",
  [GameMapType.NorthAmerica]: "NorthAmerica",
  [GameMapType.Oceania]: "Oceania",
  [GameMapType.BlackSea]: "BlackSea",
  [GameMapType.Africa]: "Africa",
  [GameMapType.Pangaea]: "Pangaea",
  [GameMapType.Asia]: "Asia",
  [GameMapType.Mars]: "Mars",
  [GameMapType.SouthAmerica]: "SouthAmerica",
  [GameMapType.Britannia]: "Britannia",
  [GameMapType.GatewayToTheAtlantic]: "GatewayToTheAtlantic",
  [GameMapType.Australia]: "Australia",
  [GameMapType.Iceland]: "Iceland",
  [GameMapType.Japan]: "Japan",
  [GameMapType.BetweenTwoSeas]: "BetweenTwoSeas",
  [GameMapType.KnownWorld]: "KnownWorld",
  [GameMapType.FaroeIslands]: "FaroeIslands",
  [GameMapType.India]: "India",
};

class GameMapLoader {
  private maps: Map<GameMapType, MapCache>;
  private loadingPromises: Map<GameMapType, Promise<MapData>>;

  constructor() {
    this.maps = new Map<GameMapType, MapCache>();
    this.loadingPromises = new Map<GameMapType, Promise<MapData>>();
  }

  public async getMapData(map: GameMapType): Promise<MapData> {
    const cachedMap = this.maps.get(map);
    if (
      cachedMap?.bin &&
      cachedMap?.nationMap &&
      cachedMap?.miniMapBin &&
      cachedMap?.cosmeticMapImageUrl !== undefined
    ) {
      return cachedMap as MapData;
    }

    if (!this.loadingPromises.has(map)) {
      this.loadingPromises.set(map, this.loadMapData(map));
    }

    const data = await this.loadingPromises.get(map)!;
    this.maps.set(map, data);
    return data;
  }

  private async loadMapData(map: GameMapType): Promise<MapData> {
    const fileName = MAP_FILE_NAMES[map];
    if (!fileName) {
      throw new Error(`No file name mapping found for map: ${map}`);
    }

    const cosmeticMapImageUrl = `/maps/${fileName}_T.png`;

    let cosmeticExists = false;
    try {
      const response = await fetch(cosmeticMapImageUrl, { method: "HEAD" });
      cosmeticExists = response.ok;
      if (!cosmeticExists) {
        console.warn(
          `Cosmetic map ${cosmeticMapImageUrl} not found (status: ${response.status}).`,
        );
      }
    } catch (e) {
      console.warn(
        `Cosmetic map ${cosmeticMapImageUrl} might not exist or fetch failed.`,
        e,
      );
    }

    const [binModule, miniBinModule, infoModule] = await Promise.all([
      import(
        `!!binary-loader!../../../resources/maps/${fileName}.bin`
      ) as Promise<BinModule>,
      import(
        `!!binary-loader!../../../resources/maps/${fileName}Mini.bin`
      ) as Promise<BinModule>,
      import(
        `../../../resources/maps/${fileName}.json`
      ) as Promise<NationMapModule>,
    ]);

    return {
      mapBin: binModule.default,
      miniMapBin: miniBinModule.default,
      nationMap: infoModule.default,
      cosmeticMapImageUrl: cosmeticExists ? cosmeticMapImageUrl : null, // ADDED: Store the URL or null
    };
  }

  public isMapLoaded(map: GameMapType): boolean {
    const mapData = this.maps.get(map);
    return (
      !!mapData?.bin &&
      !!mapData?.nationMap &&
      mapData?.cosmeticMapImageUrl !== undefined
    );
  }

  public getLoadedMaps(): GameMapType[] {
    return Array.from(this.maps.keys()).filter((map) => this.isMapLoaded(map));
  }
}

export const terrainMapFileLoader = new GameMapLoader();
