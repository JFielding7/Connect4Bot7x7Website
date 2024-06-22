#include <iostream>
#include <unordered_map>
#include <vector>
#include <random>
#include "engine.h"

using namespace std;

int main(__attribute__((unused)) int argc, char* argv[]) {
    state game_state = state{.curr_pieces = stoul(argv[1]), .opp_pieces = stoul(argv[2]), .height_map = stoul(argv[3]), .moves_made = stoi(argv[4])};

    grid* end_game_cache = (grid *) malloc(SIZE * sizeof(grid));
    for (int i = 0; i < SIZE; i++) end_game_cache[i] = 0;

    unordered_map<grid, i8> lower_bound_cache;
    unordered_map<grid, i8> upper_bound_cache;

    unsigned long pos = 0;

    vector<unsigned long> optimal_moves = best_moves(&game_state, lower_bound_cache, upper_bound_cache, end_game_cache, &pos);

    random_device rand_device;
    mt19937 rng(rand_device());
    uniform_int_distribution<mt19937::result_type> rand_range(0, optimal_moves.size() - 1);
    cout << optimal_moves[rand_range(rng)];
    return 0;
}
