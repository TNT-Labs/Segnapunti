import {DEFAULT_PRESETS, GamePreset} from '../../constants/presets';

describe('DEFAULT_PRESETS', () => {
  test('has 10 preset items', () => {
    expect(DEFAULT_PRESETS).toHaveLength(10);
  });

  test('all presets have required fields', () => {
    DEFAULT_PRESETS.forEach((preset: GamePreset) => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('icon');
      expect(preset).toHaveProperty('category');
      expect(preset).toHaveProperty('mode');
      expect(preset.defaultPlayers).toBeGreaterThanOrEqual(2);
    });
  });

  test('all preset IDs are unique', () => {
    const ids = DEFAULT_PRESETS.map((p: GamePreset) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(DEFAULT_PRESETS.length);
  });

  test('modes are valid', () => {
    const validModes: string[] = ['max', 'min', 'rounds', 'darts'];
    DEFAULT_PRESETS.forEach((preset: GamePreset) => {
      expect(validModes).toContain(preset.mode);
    });
  });

  test('categories are valid', () => {
    const validCategories: string[] = ['cards', 'table', 'sports', 'other'];
    DEFAULT_PRESETS.forEach((preset: GamePreset) => {
      expect(validCategories).toContain(preset.category);
    });
  });

  test('rounds mode presets have targetRounds and roundTargetScore', () => {
    const roundsPresets = DEFAULT_PRESETS.filter(
      (p: GamePreset) => p.mode === 'rounds'
    );
    roundsPresets.forEach((preset: GamePreset) => {
      expect(preset).toHaveProperty('targetRounds');
      expect(preset).toHaveProperty('roundTargetScore');
      if ('targetRounds' in preset && 'roundTargetScore' in preset) {
        expect(preset.targetRounds).toBeGreaterThan(0);
        expect(preset.roundTargetScore).toBeGreaterThan(0);
      }
    });
  });

  test('non-rounds mode presets have targetScore', () => {
    const nonRoundsPresets = DEFAULT_PRESETS.filter(
      (p: GamePreset) => p.mode !== 'rounds'
    );
    nonRoundsPresets.forEach((preset: GamePreset) => {
      expect(preset).toHaveProperty('targetScore');
      if ('targetScore' in preset) {
        expect(preset.targetScore).toBeGreaterThan(0);
      }
    });
  });

  test('all presets have incrementValues', () => {
    DEFAULT_PRESETS.forEach((preset: GamePreset) => {
      expect(preset).toHaveProperty('incrementValues');
      expect(Array.isArray(preset.incrementValues)).toBe(true);
      expect(preset.incrementValues.length).toBeGreaterThan(0);
    });
  });

  test('player count is within valid range', () => {
    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 8;
    DEFAULT_PRESETS.forEach((preset: GamePreset) => {
      expect(preset.defaultPlayers).toBeGreaterThanOrEqual(MIN_PLAYERS);
      expect(preset.defaultPlayers).toBeLessThanOrEqual(MAX_PLAYERS);
    });
  });
});
