// src/api/locationApi.js
// Gọi API công khai để lấy danh sách quốc gia và tỉnh/thành

import axios from "axios";

// Cache để không gọi lại API nhiều lần
let countriesCache = null;
let vietnamProvincesCache = null;

const locationApi = {
  // Lấy danh sách quốc gia từ REST Countries API
  async getCountries() {
    if (countriesCache) return countriesCache;

    try {
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2");
      const countries = res.data
        .map((c) => ({
          code: c.cca2,
          name: c.name.common,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Đưa Vietnam lên đầu
      const vietnamIndex = countries.findIndex((c) => c.code === "VN");
      if (vietnamIndex > -1) {
        const [vietnam] = countries.splice(vietnamIndex, 1);
        countries.unshift(vietnam);
      }

      countriesCache = countries;
      return countries;
    } catch (err) {
      console.error("Failed to fetch countries:", err);
      // Fallback nếu API lỗi
      return [
        { code: "VN", name: "Vietnam" },
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "AU", name: "Australia" },
        { code: "CA", name: "Canada" },
        { code: "SG", name: "Singapore" },
        { code: "JP", name: "Japan" },
        { code: "KR", name: "South Korea" },
      ];
    }
  },

  // Lấy danh sách tỉnh/thành Việt Nam từ API
  async getVietnamProvinces() {
    if (vietnamProvincesCache) return vietnamProvincesCache;

    try {
      const res = await axios.get("https://provinces.open-api.vn/api/p/");
      const provinces = res.data
        .map((p) => ({
          code: p.code,
          name: p.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "vi"));

      vietnamProvincesCache = provinces;
      return provinces;
    } catch (err) {
      console.error("Failed to fetch Vietnam provinces:", err);
      // Fallback nếu API lỗi
      return [
        { code: 1, name: "Hà Nội" },
        { code: 79, name: "TP. Hồ Chí Minh" },
        { code: 48, name: "Đà Nẵng" },
        { code: 92, name: "Cần Thơ" },
        { code: 31, name: "Hải Phòng" },
      ];
    }
  },

  // Lấy danh sách city theo country
  async getCitiesByCountry(countryName) {
    if (!countryName || countryName === "Vietnam" || countryName === "Viet Nam") {
      return await this.getVietnamProvinces();
    }
    // Với các nước khác, trả về mảng rỗng (user nhập tự do)
    // Có thể mở rộng sau bằng GeoNames API
    return [];
  },

  // Clear cache nếu cần
  clearCache() {
    countriesCache = null;
    vietnamProvincesCache = null;
  },
};

export default locationApi;
