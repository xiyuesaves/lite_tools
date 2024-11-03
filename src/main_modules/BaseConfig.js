import { writeFileSync, readFileSync } from "node:fs";

export class BaseConfig {
  constructor(userConfigPath) {
    this.userConfigPath = userConfigPath;
    this.list = null;
    try {
      this.list = new Map(JSON.parse(readFileSync(this.userConfigPath, "utf-8")));
    } catch {
      this.initialConfigFile();
    }
  }
  get(id) {
    return this.list.get(id);
  }
  set(id, value) {
    this.list.set(id, value);
    this.save();
  }
  delete(id) {
    this.list.delete(id);
    this.save();
  }
  initialConfigFile() {
    this.list = new Map();
    this.save();
  }
  save() {
    writeFileSync(this.userConfigPath, JSON.stringify([...this.list]));
  }
}
