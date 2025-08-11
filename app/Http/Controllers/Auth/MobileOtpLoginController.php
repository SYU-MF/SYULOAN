<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MobileOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MobileOtpLoginController extends Controller
{
    public function requestOtp(Request $request)
    {
        $request->validate([
            'mobile_number' => 'required|exists:users,mobile_number',
        ]);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(5);

        MobileOtp::updateOrCreate(
            ['mobile_number' => $request->mobile_number],
            [
                'otp' => $otp,
                'expires_at' => $expiresAt,
            ]
        );

        // Return an Inertia response with OTP and expiration as props
        return Inertia::render('auth/login', [
            'otp' => $otp,
            'expires_at' => $expiresAt->toISOString(),
            'mobile_number' => $request->mobile_number,
            'step' => 'otp',
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'mobile_number' => 'required',
            'otp' => 'required|size:6',
        ]);

        $otpRecord = MobileOtp::where('mobile_number', $request->mobile_number)
            ->where('otp', $request->otp)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP.'], 422);
        }

        $user = User::where('mobile_number', $request->mobile_number)->first();
        Auth::login($user);

        // Optionally, delete OTP after use
        $otpRecord->delete();

        return response()->json(['success' => true, 'redirect' => route('dashboard')]);
    }
}
