<?php

namespace App\Domain\Users\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserFollow;

class FollowController extends Controller
{
    public function follow(Request $request, User $user)
    {
        if (!auth()->check()) {
            abort(401);
        }

        $me = (int) auth()->id();
        if ($me === (int) $user->id) {
            return response()->json(['message' => 'Não é possível seguir a si mesmo.'], 422);
        }

        UserFollow::query()->firstOrCreate([
            'follower_id' => $me,
            'followed_id' => (int) $user->id,
        ]);

        return response()->json(['following' => true]);
    }

    public function unfollow(Request $request, User $user)
    {
        if (!auth()->check()) {
            abort(401);
        }

        $me = (int) auth()->id();
        if ($me === (int) $user->id) {
            return response()->json(['message' => 'Não é possível seguir a si mesmo.'], 422);
        }

        UserFollow::query()
            ->where('follower_id', $me)
            ->where('followed_id', (int) $user->id)
            ->delete();

        return response()->json(['following' => false]);
    }
}

