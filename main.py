import subprocess
import sys
import os
import time
import signal
from pathlib import Path

def main():
    root_dir = Path(__file__).parent.resolve()

    # Configure processes
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    frontend_cmd = ["npm", "run", "dev"]

    print("=========================================================")
    print("  NIRNAY Strategic Decision Intelligence Platform")
    print("=========================================================")
    print("  Backend API:        http://127.0.0.1:8000")
    print("  API Documentation:  http://127.0.0.1:8000/docs")
    print("  Frontend UI:        http://localhost:5173")
    print("  3D Wargaming Arena: http://localhost:5173/wargame")
    print("=========================================================\n")

    processes = []

    # Process creation flags for Windows to isolate process tree / handle signals
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0

    try:
        # Start backend
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=root_dir,
            shell=False,
            creationflags=creationflags
        )
        processes.append(backend_proc)

        # Start frontend (cmd.exe on Windows for npm)
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=root_dir,
            shell=True,
            creationflags=creationflags
        )
        processes.append(frontend_proc)

        # Monitor processes
        while True:
            for p in processes:
                ret = p.poll()
                if ret is not None:
                    print(f"\n[Process exited] {p.args} exited with code {ret}")
                    raise KeyboardInterrupt
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\nShutting down backend and frontend processes...")
        
        for p in processes:
            if p.poll() is None:
                try:
                    if os.name == "nt":
                        # Forcefully terminate process tree on Windows (including child node/uvicorn subprocesses)
                        subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
                    else:
                        p.terminate()
                except Exception as e:
                    print(f"Error stopping process {p.pid}: {e}")

        # Final check & force kill fallback
        time.sleep(0.5)
        for p in processes:
            if p.poll() is None:
                try:
                    p.kill()
                except Exception:
                    pass

        print("Shutdown complete. All child processes terminated.")

if __name__ == "__main__":
    # Ensure SIGINT signal handler triggers KeyboardInterrupt reliably
    signal.signal(signal.SIGINT, signal.default_int_handler)
    main()
