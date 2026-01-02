type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const noopAsyncStorage: AsyncStorageLike = {
  async getItem() {
    return null;
  },
  async setItem() {
    return;
  },
  async removeItem() {
    return;
  },
};

export default noopAsyncStorage;


