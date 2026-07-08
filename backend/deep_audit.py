import os
import ast
import traceback

def check_syntax():
    errors = []
    for root, dirs, files in os.walk('app'):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    try:
                        ast.parse(content)
                    except SyntaxError as e:
                        errors.append(f"{path}: {e}")
    return errors

if __name__ == "__main__":
    syntax_errors = check_syntax()
    if syntax_errors:
        print("Syntax Errors Found:")
        for err in syntax_errors:
            print(err)
    else:
        print("No syntax errors found.")
