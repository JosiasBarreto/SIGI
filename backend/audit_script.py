import os
import ast

def analyze_directory(path):
    python_files = []
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def get_endpoints(files):
    endpoints = []
    for file in files:
        if 'controller' in file:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            for decorator in node.decorator_list:
                                if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute) and decorator.func.attr == 'route':
                                    if len(decorator.args) > 0:
                                        route = decorator.args[0].value
                                        methods = ['GET']
                                        for kwarg in decorator.keywords:
                                            if kwarg.arg == 'methods' and isinstance(kwarg.value, ast.List):
                                                methods = [elt.value for elt in kwarg.value.elts if isinstance(elt, ast.Constant)]
                                        endpoints.append(f"{file.split('/')[-1]} -> {methods} {route}")
                except Exception as e:
                    pass
    return endpoints

def get_models(files):
    models = []
    for file in files:
        if 'models' in file:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.ClassDef):
                            for base in node.bases:
                                if isinstance(base, ast.Name) and base.id == 'db.Model':
                                    models.append(node.name)
                                elif hasattr(base, 'attr') and getattr(base, 'attr', '') == 'Model':
                                    models.append(node.name)
                except Exception as e:
                    pass
    return models

files = analyze_directory('backend/app')
print(f"Total Python Files: {len(files)}")
endpoints = get_endpoints(files)
print(f"Total Endpoints: {len(endpoints)}")
print("\nEndpoints Sample:")
for e in endpoints[:10]:
    print(e)
models = get_models(files)
print(f"\nTotal Models: {len(models)}")
print("\nModels Sample:")
for m in models[:10]:
    print(m)
