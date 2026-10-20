// vite.config.ts
import { defineConfig, loadEnv } from "file:///E:/Antigravity%20Projects/lawyer-select/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Antigravity%20Projects/lawyer-select/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "E:\\Antigravity Projects\\lawyer-select";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  return {
    plugins: [
      react(),
      {
        name: "stripe-api-dev-server",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === "/api/checkout/purchase-lead" && req.method === "POST") {
              let bodyStr = "";
              req.on("data", (chunk) => {
                bodyStr += chunk;
              });
              req.on("end", async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {};
                  const mockReq = { method: "POST", body, headers: req.headers };
                  const mockRes = {
                    status(code) {
                      res.statusCode = code;
                      return this;
                    },
                    json(data) {
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify(data));
                      return this;
                    }
                  };
                  const handlerModule = await server.ssrLoadModule("/api/checkout/purchase-lead.ts");
                  await handlerModule.default(mockReq, mockRes);
                } catch (err) {
                  console.error("Error in /api/checkout/purchase-lead:", err);
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: err.message || "Server error" }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port: 3e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxBbnRpZ3Jhdml0eSBQcm9qZWN0c1xcXFxsYXd5ZXItc2VsZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxBbnRpZ3Jhdml0eSBQcm9qZWN0c1xcXFxsYXd5ZXItc2VsZWN0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9BbnRpZ3Jhdml0eSUyMFByb2plY3RzL2xhd3llci1zZWxlY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIE9iamVjdC5hc3NpZ24ocHJvY2Vzcy5lbnYsIGVudik7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnc3RyaXBlLWFwaS1kZXYtc2VydmVyJyxcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVxLnVybCA9PT0gJy9hcGkvY2hlY2tvdXQvcHVyY2hhc2UtbGVhZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICAgIGxldCBib2R5U3RyID0gJyc7XG4gICAgICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgICAgICAgICAgICAgIGJvZHlTdHIgKz0gY2h1bms7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYm9keSA9IGJvZHlTdHIgPyBKU09OLnBhcnNlKGJvZHlTdHIpIDoge307XG4gICAgICAgICAgICAgICAgICBjb25zdCBtb2NrUmVxID0geyBtZXRob2Q6ICdQT1NUJywgYm9keSwgaGVhZGVyczogcmVxLmhlYWRlcnMgfTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2tSZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cyhjb2RlOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IGNvZGU7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGpzb24oZGF0YTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyTW9kdWxlID0gYXdhaXQgc2VydmVyLnNzckxvYWRNb2R1bGUoJy9hcGkvY2hlY2tvdXQvcHVyY2hhc2UtbGVhZC50cycpO1xuICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlck1vZHVsZS5kZWZhdWx0KG1vY2tSZXEsIG1vY2tSZXMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiAvYXBpL2NoZWNrb3V0L3B1cmNoYXNlLWxlYWQ6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ1NlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlTLFNBQVMsY0FBYyxlQUFlO0FBQy9VLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFNBQU8sT0FBTyxRQUFRLEtBQUssR0FBRztBQUU5QixTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTjtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sZ0JBQWdCLFFBQVE7QUFDdEIsaUJBQU8sWUFBWSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVM7QUFDL0MsZ0JBQUksSUFBSSxRQUFRLGlDQUFpQyxJQUFJLFdBQVcsUUFBUTtBQUN0RSxrQkFBSSxVQUFVO0FBQ2Qsa0JBQUksR0FBRyxRQUFRLENBQUMsVUFBVTtBQUN4QiwyQkFBVztBQUFBLGNBQ2IsQ0FBQztBQUNELGtCQUFJLEdBQUcsT0FBTyxZQUFZO0FBQ3hCLG9CQUFJO0FBQ0Ysd0JBQU0sT0FBTyxVQUFVLEtBQUssTUFBTSxPQUFPLElBQUksQ0FBQztBQUM5Qyx3QkFBTSxVQUFVLEVBQUUsUUFBUSxRQUFRLE1BQU0sU0FBUyxJQUFJLFFBQVE7QUFDN0Qsd0JBQU0sVUFBVTtBQUFBLG9CQUNkLE9BQU8sTUFBYztBQUNuQiwwQkFBSSxhQUFhO0FBQ2pCLDZCQUFPO0FBQUEsb0JBQ1Q7QUFBQSxvQkFDQSxLQUFLLE1BQVc7QUFDZCwwQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsMEJBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQzVCLDZCQUFPO0FBQUEsb0JBQ1Q7QUFBQSxrQkFDRjtBQUNBLHdCQUFNLGdCQUFnQixNQUFNLE9BQU8sY0FBYyxnQ0FBZ0M7QUFDakYsd0JBQU0sY0FBYyxRQUFRLFNBQVMsT0FBTztBQUFBLGdCQUM5QyxTQUFTLEtBQVU7QUFDakIsMEJBQVEsTUFBTSx5Q0FBeUMsR0FBRztBQUMxRCxzQkFBSSxhQUFhO0FBQ2pCLHNCQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxzQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sSUFBSSxXQUFXLGVBQWUsQ0FBQyxDQUFDO0FBQUEsZ0JBQ2xFO0FBQUEsY0FDRixDQUFDO0FBQ0Q7QUFBQSxZQUNGO0FBQ0EsaUJBQUs7QUFBQSxVQUNQLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
