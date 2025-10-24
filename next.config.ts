import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bật React Compiler (tối ưu hiệu năng)
  reactCompiler: true,

  // Cho phép truy cập từ LAN trong môi trường dev
  allowedDevOrigins: ["192.168.1.30"],

  // 🧩 Thêm config rỗng cho Turbopack để tắt cảnh báo
  turbopack: {},
};

export default nextConfig;
