# input: package execution via `python -m agent_2_dashboard_adapter`
# output: started dashboard adapter HTTP server on the configured host and port
# pos: module entrypoint for the deployable agent_2 adapter package
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
try:
    from .server import main
except ImportError:  # pragma: no cover - direct execution fallback
    from server import main


if __name__ == "__main__":
    main()
