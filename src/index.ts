function createDefaultLootplanSeed(): number {
	return (tick() % 1) * math.pow(10, 10);
}

export declare type LootItem = {
	Name: string;
	Chance: number;
};

export class SingleLootplan {
	private randomizer: Random;
	private loot: Record<string, LootItem> = {};
	private lootList = new Array<LootItem>();
	private lootCount = 0;
	private totalChance = 0;

	private updateLootList(): void {
		const newLootList = new Array<LootItem>();

		for (const [, lootItem] of pairs(this.loot)) {
			newLootList.push(lootItem);
		}

		newLootList.sort((a, b) => {
			return a.Chance < b.Chance;
		});

		this.lootList = newLootList;
	}

	public constructor(seed = createDefaultLootplanSeed()) {
		this.randomizer = new Random(seed);
	}

	public AddLoot(name: string, chance: number): LootItem | undefined {
		if (this.loot[name] !== undefined) return undefined;

		const newLootItem: LootItem = {
			Name: name,
			Chance: chance,
		};

		this.loot[name] = newLootItem;
		this.lootCount++;
		this.totalChance += chance;
		this.updateLootList();

		return newLootItem;
	}

	public AddLootFromRecord(record: Record<string, number>): Record<string, LootItem | undefined> {
		const result: Record<string, LootItem | undefined> = {};
		for (const [name, chance] of pairs(record)) {
			result[name] = this.AddLoot(name, chance);
		}
		return result;
	}

	public GetLootChance(name: string): number | undefined {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return undefined;

		return lootItem.Chance;
	}

	public GetCalculatedLootChance(name: string, luckMultiplier = 1): number | undefined {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return undefined;

		if (luckMultiplier >= 1) {
			return lootItem.Chance * luckMultiplier;
		} else {
			const negativeMultiplier: number = 1 / luckMultiplier;
			return lootItem.Chance * negativeMultiplier;
		}
	}

	public GetTrueLootChance(name: string): number | undefined {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return undefined;

		return (lootItem.Chance / this.totalChance) * 100;
	}

	public RemoveLoot(name: string): boolean {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return false;

		this.totalChance -= lootItem.Chance;
		this.lootCount--;
		this.loot[name] = undefined!;
		this.updateLootList();

		return true;
	}

	public ClearLoot(): boolean {
		table.clear(this.loot);
		this.updateLootList();
		this.lootCount = 0;
		this.totalChance = 0;
		return true;
	}

	public ChangeLootChance(name: string, newChance: number): boolean {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return false;

		this.totalChance += newChance - lootItem.Chance;
		lootItem.Chance = newChance;
		this.updateLootList();

		return true;
	}

	public GetRandomLoot(luckMultiplier = 1): LootItem | undefined {
		if (luckMultiplier >= 1) {
			const result: number = this.randomizer.NextNumber();
			let aggregate = 0;

			for (const [i, lootItem] of ipairs(this.lootList)) {
				const realChance: number = lootItem.Chance * luckMultiplier;

				if (result < (realChance + aggregate) / this.totalChance) {
					return lootItem;
				}

				aggregate += realChance;
			}
		} else {
			const realLuckMultiplier: number = 1 / luckMultiplier;
			const result: number = this.randomizer.NextNumber();
			let aggregate = 0;

			for (const i of $range(this.lootCount, 1, -1)) {
				const lootItem: LootItem = this.lootList[i];
				const realChance: number = lootItem.Chance * realLuckMultiplier;

				if (result > (realChance + aggregate) / this.totalChance) {
					return lootItem;
				}

				aggregate += realChance;
			}
		}
	}
}

export class MultiLootplan {
	private randomizer: Random;
	private loot: Record<string, LootItem> = {};

	public constructor(seed = createDefaultLootplanSeed()) {
		this.randomizer = new Random(seed);
	}

	public AddLoot(name: string, chance: number): LootItem | undefined {
		if (this.loot[name] !== undefined) return undefined;

		const newLootItem: LootItem = {
			Name: name,
			Chance: chance,
		};

		this.loot[name] = newLootItem;

		return newLootItem;
	}

	public AddLootFromRecord(record: Record<string, number>): Record<string, LootItem | undefined> {
		const result: Record<string, LootItem | undefined> = {};
		for (const [name, chance] of pairs(record)) {
			result[name] = this.AddLoot(name, chance);
		}
		return result;
	}

	public GetLootChance(name: string): number | undefined {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return undefined;

		return lootItem.Chance;
	}

	public GetCalculatedLootChance(name: string, luckMultiplier = 1): number | undefined {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return undefined;

		return (lootItem.Chance / 100) * luckMultiplier;
	}

	public RemoveLoot(name: string): boolean {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return false;

		this.loot[name] = undefined!;

		return true;
	}

	public ClearLoot(): boolean {
		table.clear(this.loot);
		return true;
	}

	public ChangeLootChance(name: string, newChance: number): boolean {
		const lootItem: LootItem | undefined = this.loot[name];
		if (lootItem === undefined) return false;

		lootItem.Chance = newChance;

		return true;
	}

	public GetRandomLoot(amount: number, luckMultiplier = 1): LootItem[] {
		const loot = new Array<LootItem>();

		while (loot.size() < amount) {
			for (const [, lootItem] of pairs(this.loot)) {
				const result: number = this.randomizer.NextNumber();
				const realChance: number = (lootItem.Chance / 100) * luckMultiplier;
				if (result < realChance && !(loot.size() >= amount)) {
					loot.push(lootItem);
				}
			}
		}

		return loot;
	}
}

export function CreateLootplan(lootplanType?: "Single" | "Multi", seed?: number): SingleLootplan | MultiLootplan {
	if (typeIs(lootplanType, "string") && lootplanType === "Multi") {
		return new MultiLootplan(seed) as MultiLootplan;
	}
	return new SingleLootplan(seed) as SingleLootplan;
}
