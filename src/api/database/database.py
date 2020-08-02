import pandas as pd

from src import utility


def get_df():
    df = pd.read_feather(utility.PROJECT_ROOT / "temp-path.feather")
    try:
        yield df
    finally:
        del df
